/**
 * Exercises the connection banner's state machine in a real DOM.
 *
 * The logic that matters is the part that is easy to get wrong and impossible
 * to eyeball: a problem that appears, a problem that clears, and a
 * "Back online" confirmation that must only appear if something was actually
 * broken. A banner that congratulates you on being online when nothing was
 * ever wrong is worse than no banner, so that case is asserted explicitly.
 */
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { mkdtempSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { JSDOM } from "jsdom";

const dir = mkdtempSync(resolve(process.cwd(), ".a11y-check-"));
const out = join(dir, "bundle.mjs");

process.on("exit", () => {
    try {
        rmSync(dir, { recursive: true, force: true });
    } catch {
        /* best effort */
    }
});

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "https://quickfix.test/",
    pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;
// Node 24 exposes `navigator` as a getter-only global, so it has to be
// redefined rather than assigned.
Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true
});
global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement;
global.requestAnimationFrame = dom.window.requestAnimationFrame?.bind(dom.window) ?? ((cb) => setTimeout(cb, 0));
global.IS_REACT_ACT_ENVIRONMENT = true;

await build({
    stdin: {
        contents: `
        import { createRoot } from "react-dom/client";
        import { act, createElement } from "react";
        import ConnectionBanner from "./src/components/ui/ConnectionBanner.jsx";

        export function mount(el) {
            const root = createRoot(el);
            act(() => root.render(createElement(ConnectionBanner)));
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

const { reportApiUnreachable, reportApiReachable } = await import(
    pathToFileURL(resolve(process.cwd(), "src/lib/connectivity.js")).href
);

const container = document.getElementById("root");
const failures = [];
const check = (name, condition, detail = "") => {
    if (condition) {
        console.log(`  PASS  ${name}`);
    } else {
        console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
        failures.push(name);
    }
};

const text = () => container.textContent ?? "";
const live = () => container.querySelector('[role="status"]');

console.log("Connection banner state machine");

const root = mount(container);

// jsdom reports onLine === true by default, and the API has not been used yet.
check("hidden while healthy", container.innerHTML === "", container.innerHTML.slice(0, 80));

// --- API unreachable --------------------------------------------------------
await act(async () => {
    reportApiUnreachable();
});
check("shows a problem when the API stops responding", text().includes("Can't reach QuickFix"), text());
check("problem is announced politely", live()?.getAttribute("aria-live") === "polite");

// --- Recovery ---------------------------------------------------------------
await act(async () => {
    reportApiReachable();
});
check("confirms recovery", text().includes("Back online"), text());

// --- Offline takes precedence ----------------------------------------------
await act(async () => {
    dom.window.dispatchEvent(new dom.window.Event("offline"));
});
check("reports being offline", text().includes("You're offline"), text());
check("offline message does not blame the server", !text().includes("Can't reach QuickFix"), text());

await act(async () => {
    dom.window.dispatchEvent(new dom.window.Event("online"));
});
check("confirms recovery from offline", text().includes("Back online"), text());

// --- The confirmation must expire on its own --------------------------------
await act(async () => {
    dom.window.Event; // no-op, keeps the timer semantics obvious below
    await new Promise((resolve) => setTimeout(resolve, 3400));
});
check("confirmation disappears after a moment", container.innerHTML === "", container.innerHTML.slice(0, 120));

// --- No spurious congratulations -------------------------------------------
await act(async () => {
    reportApiReachable();
});
check(
    "stays hidden when nothing was ever broken",
    container.innerHTML === "",
    container.innerHTML.slice(0, 120)
);

await act(async () => {
    root.unmount();
});

console.log(
    failures.length === 0
        ? "\nAll connection banner checks passed."
        : `\n${failures.length} check(s) failed.`
);

process.exit(failures.length === 0 ? 0 : 1);
