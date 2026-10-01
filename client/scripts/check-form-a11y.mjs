/**
 * Renders the shared form primitives and asserts the accessibility wiring is
 * actually present in the emitted HTML.
 *
 * The whole point of the `useFieldA11y` change is that a field without an
 * explicit `id` still ends up with a label that is programmatically bound to
 * it, and that a visible error is attached to the control rather than being
 * decoration next to it. Compiling is not evidence of that, so this renders
 * the real components and reads the markup.
 *
 * Uses `createElement` rather than JSX so Node can run this file directly.
 */
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { createElement as h } from "react";

// The bundle must live inside the project so Node can resolve the externalised
// `react` / `react-dom` from this repo's node_modules.
const dir = mkdtempSync(resolve(process.cwd(), ".a11y-check-"));
const out = join(dir, "bundle.mjs");

process.on("exit", () => {
    try {
        rmSync(dir, { recursive: true, force: true });
    } catch {
        /* best effort */
    }
});

await build({
    stdin: {
        contents: `
        import { renderToStaticMarkup } from "react-dom/server";
        import Input from "./src/components/ui/Input.jsx";
        import Select from "./src/components/ui/Select.jsx";
        import Textarea from "./src/components/ui/Textarea.jsx";

        export const render = (node) => renderToStaticMarkup(node);
        export { Input, Select, Textarea };
        `,
        resolveDir: process.cwd(),
        loader: "jsx"
    },
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: out,
    jsx: "automatic",
    external: ["react", "react-dom", "react/jsx-runtime"]
});

const { render, Input, Select, Textarea } = await import(pathToFileURL(out).href);

const failures = [];
const check = (name, condition, detail = "") => {
    if (condition) {
        console.log(`  PASS  ${name}`);
    } else {
        console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
        failures.push(name);
    }
};

console.log("Form primitive a11y wiring");

// 1. No id supplied: the label must still be bound to the control.
const noId = render(h(Input, { label: "Email", type: "email", defaultValue: "" }));
const labelFor = noId.match(/<label for="([^"]+)"/)?.[1];
const inputId = noId.match(/<input[^>]*\bid="([^"]+)"/)?.[1];
check("auto-generates an id when none is given", Boolean(inputId), noId);
check("label htmlFor matches the control id", Boolean(labelFor) && labelFor === inputId, `for=${labelFor} id=${inputId}`);

// 2. Explicit id is respected, never overwritten.
const explicit = render(h(Input, { label: "Name", id: "given-id", defaultValue: "" }));
check("explicit id is preserved", /id="given-id"/.test(explicit) && /for="given-id"/.test(explicit), explicit);

// 3. An error is attached to the control, not merely rendered beside it.
const withError = render(h(Input, { label: "Email", error: "Email is required", defaultValue: "" }));
// React emits attributes in JSX prop order, so match the tag first and pull
// `id` out of that same tag rather than assuming a fixed ordering.
const alertTag = withError.match(/<p[^>]*role="alert"[^>]*>/)?.[0] ?? "";
const errId = alertTag.match(/\bid="([^"]+)"/)?.[1];
const describedBy = withError.match(/aria-describedby="([^"]+)"/)?.[1];
check("error paragraph has role=alert", /role="alert"/.test(withError), withError);
check("error paragraph exposes an id", Boolean(errId), withError);
check("aria-describedby points at the error", Boolean(errId) && describedBy === errId, `describedby=${describedBy} errId=${errId}`);
check("aria-invalid is set when invalid", /aria-invalid="true"/.test(withError), withError);

// 4. Clean field must not claim to be invalid.
const clean = render(h(Input, { label: "Email", defaultValue: "" }));
check("no aria-invalid when there is no error", !/aria-invalid/.test(clean), clean);
check("no aria-describedby when there is no message", !/aria-describedby/.test(clean), clean);

// 5. required renders the marker but keeps it out of the accessible name.
const req = render(h(Input, { label: "Email", required: true, defaultValue: "" }));
check("required sets the native attribute", /required/.test(req), req);
check("required marker is hidden from screen readers", /<span[^>]*aria-hidden="true"[^>]*>\s*\*/.test(req), req);

// 6. Select and Textarea get the same treatment.
const sel = render(h(Select, { label: "Category", error: "Pick one", options: [{ value: "a", label: "A" }] }));
check("Select wires aria-invalid", /aria-invalid="true"/.test(sel), sel);
check("Select wires aria-describedby", /aria-describedby=/.test(sel), sel);
check("Select error has role=alert", /role="alert"/.test(sel), sel);

const ta = render(h(Textarea, { label: "Notes", error: "Too short", defaultValue: "" }));
check("Textarea wires aria-invalid", /aria-invalid="true"/.test(ta), ta);
check("Textarea error has role=alert", /role="alert"/.test(ta), ta);

// 7. Callers can still override anything we set.
const override = render(h(Input, { label: "Email", id: "x", "aria-describedby": "custom", defaultValue: "" }));
check("caller-supplied aria-describedby wins", /aria-describedby="custom"/.test(override), override);

console.log(failures.length === 0 ? "\nAll form a11y checks passed." : `\n${failures.length} check(s) failed.`);

process.exit(failures.length === 0 ? 0 : 1);
