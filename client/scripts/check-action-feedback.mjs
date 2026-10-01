/**
 * Exercises the shared action-feedback hook in a real DOM.
 *
 * The regressions this guards against are the ones that make a form feel
 * broken rather than helpful, and none of them are visible by reading the code:
 *
 *   - A 400/422 with no message body used to produce no field error and no
 *     banner, so the user pressed submit and the page simply did nothing.
 *   - The hook kept its own `formError` while the validator kept another, so a
 *     server rejection that could not be pinned to a field was reported into a
 *     state the page never read.
 *   - A retry action that re-runs the request has to go through the same
 *     feedback path, or the second attempt fails silently.
 */
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { mkdtempSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { JSDOM } from "jsdom";

let failures = 0;
let checks = 0;

const check = (name, condition) => {
    checks += 1;

    if (condition) {
        console.log(`  PASS  ${name}`);
    } else {
        failures += 1;
        console.log(`  FAIL  ${name}`);
    }
};

const dir = mkdtempSync(resolve(process.cwd(), ".feedback-check-"));
const out = join(dir, "bundle.mjs");

process.on("exit", () => {
    try {
        rmSync(dir, { recursive: true, force: true });
    } catch {
        /* best effort */
    }
});

const dom = new JSDOM(
    "<!doctype html><html><body><div id='root'></div></body></html>",
    {
        url: "https://quickfix.test/",
        pretendToBeVisual: true
    }
);

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true
});
global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement;
global.requestAnimationFrame =
    dom.window.requestAnimationFrame?.bind(dom.window) ??
    ((cb) => setTimeout(cb, 0));
global.IS_REACT_ACT_ENVIRONMENT = true;

await build({
    stdin: {
        contents: `
        import { useEffect } from "react";
        import { createRoot } from "react-dom/client";
        import { act } from "react";
        import { ToastProvider } from "./src/components/ui/ToastProvider.jsx";
        import { useActionFeedback } from "./src/hooks/useActionFeedback.js";

        function Probe({ schema }) {
            const feedback = useActionFeedback({ schema });

            // The test drives the hook directly, exactly as a page's submit
            // handler would.
            useEffect(() => {
                globalThis.__feedback = feedback;
            });

            return null;
        }

        export function mount(el, schema) {
            const root = createRoot(el);
            act(() =>
                root.render(
                    <ToastProvider>
                        <Probe schema={schema} />
                    </ToastProvider>
                )
            );
            return root;
        }

        export { act };
        `,
        resolveDir: process.cwd(),
        loader: "jsx"
    },
    bundle: true,
    format: "esm",
    platform: "browser",
    outfile: out,
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"development"' }
});

const { mount, act } = await import(pathToFileURL(out).href);

const { rules } = await import(
    pathToFileURL(resolve(process.cwd(), "src/lib/validation.js")).href
);

const container = document.getElementById("root");
const schema = { email: [rules.required(), rules.email()] };

mount(container, schema);

/** Toasts currently on screen, as plain text. */
const toasts = () =>
    [...container.ownerDocument.querySelectorAll("p")].map((n) => n.textContent);

const hasToast = (text) => toasts().some((line) => line.includes(text));

const buttons = () =>
    [...container.ownerDocument.querySelectorAll("button")].map((b) =>
        b.textContent.trim()
    );

/**
 * Toasts stack for up to 7s and the hook keeps its field errors, so every case
 * starts from a clean screen. Without this, a "Try again" button or a field
 * error from an earlier case satisfies a later assertion.
 */
const reset = async () => {
    for (const button of [
        ...container.ownerDocument.querySelectorAll(
            'button[aria-label="Dismiss notification"]'
        )
    ]) {
        await act(async () => {
            button.dispatchEvent(
                new dom.window.MouseEvent("click", { bubbles: true })
            );
        });
    }

    await act(async () => {
        globalThis.__feedback.reset();
    });
};

const axiosError = (status, message) => ({
    response: { status, data: message ? { message } : {} }
});

/** Runs `task` through the hook and lets React settle. */
const run = async (task, config) => {
    let result;

    await act(async () => {
        result = await globalThis.__feedback.run(task, config);
    });

    return result;
};

console.log("action feedback");

// --- success ---------------------------------------------------------------
{
    await reset();

    const result = await run(async () => ({ id: 1 }), { success: "Offer sent" });

    check("a successful action reports ok", result.ok === true);
    check("a successful action returns the payload", result.data?.id === 1);
    check("a successful action confirms in a toast", hasToast("Offer sent"));
}

// --- validation placed on the field ---------------------------------------
{
    await reset();

    await run(
        async () => {
            throw axiosError(422, "Email is required");
        },
        { success: "Should not appear" }
    );

    const { fieldErrors, formError } = globalThis.__feedback;

    check(
        "a field-level rejection lands on that field",
        typeof fieldErrors.email === "string" && fieldErrors.email.length > 0
    );
    check(
        "a field-level rejection is not repeated as a banner",
        formError === ""
    );
    check(
        "a field-level rejection shows no headline toast",
        !hasToast("Should not appear")
    );
}

// --- validation that cannot be attributed to a field -----------------------
{
    await reset();

    await run(async () => {
        throw axiosError(400, "Provide all required information");
    });

    const { formError, fieldErrors } = globalThis.__feedback;

    check(
        "an unattributable rejection becomes a banner",
        typeof formError === "string" && formError.includes("required")
    );
    check(
        "an unattributable rejection invents no field error",
        Object.keys(fieldErrors).length === 0
    );
}

// --- the silent-failure regression ----------------------------------------
{
    await reset();

    await run(async () => {
        // A 400 with no message body: nothing to map and nothing to say.
        throw axiosError(422);
    });

    const { formError, fieldErrors } = globalThis.__feedback;

    check(
        "a silent validation rejection still tells the user something",
        hasToast("Please check the form") ||
            (typeof formError === "string" && formError.length > 0)
    );
    check(
        "a silent validation rejection invents no field error",
        Object.keys(fieldErrors).length === 0
    );
}

// --- non-validation failure with a retry ----------------------------------
{
    await reset();

    let attempts = 0;

    await run(
        async () => {
            attempts += 1;
            throw new Error("Network Error");
        },
        { success: "Never", retry: true }
    );

    check(
        "a network failure is described in plain language",
        hasToast("Can't reach QuickFix")
    );
    check(
        "a network failure reassures that nothing was lost",
        toasts().some((line) => line.includes("still here"))
    );

    const retryButton = [...container.ownerDocument.querySelectorAll("button")]
        .find((b) => b.textContent.trim() === "Try again");

    check("a retryable failure offers a retry action", Boolean(retryButton));

    if (retryButton) {
        await act(async () => {
            retryButton.dispatchEvent(
                new dom.window.MouseEvent("click", { bubbles: true })
            );
        });

        check("the retry action re-sends the request", attempts === 2);
    }
}

// --- permanent failure offers no pointless retry --------------------------
{
    await reset();

    await run(
        async () => {
            throw axiosError(403, "Forbidden");
        },
        { success: "Never", retry: true }
    );

    check("a permanent failure is described", hasToast("don't have access"));
    check("a permanent failure offers no retry", !buttons().includes("Try again"));
}

// --- internal wording never reaches the user ------------------------------
{
    await reset();

    await run(async () => {
        throw axiosError(500, "Error: connect ECONNREFUSED 127.0.0.1:5432");
    });

    const spoken = toasts().join(" | ");

    check(
        "internal server wording never reaches the user",
        !spoken.includes("ECONNREFUSED") && !spoken.includes("5432")
    );
    check("a server fault still gives a plain headline", hasToast("went wrong"));
}

console.log("");
console.log(`${checks - failures}/${checks} checks passed`);

// Toast timers run for up to 7s and would otherwise hold the process open.
process.exit(failures > 0 ? 1 : 0);
