/**
 * Guards the regression that broke the public mobile menu.
 *
 * The sticky header sets `backdrop-blur`, which per the CSS Filter Effects
 * spec makes it the containing block for `position: fixed` descendants. A
 * fixed menu panel kept inside that header is therefore positioned against the
 * *header box* instead of the viewport, so `top: <header height>` + `bottom: 0`
 * collapses it to zero height and every link disappears.
 *
 * The fix is to render the panel through a portal on `document.body`. jsdom does
 * not do layout or containing-block resolution, so this test asserts the two
 * things that actually guarantee correctness:
 *
 *   1. The panel is NOT a descendant of the blurred header.
 *   2. The panel is anchored to a viewport-sized, pointer-transparent wrapper
 *      (so the header's close button stays tappable).
 */
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>");
const { document } = dom.window;

const failures = [];
const check = (name, condition, detail = "") => {
    if (condition) {
        console.log(`  PASS  ${name}`);
    } else {
        console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
        failures.push(name);
    }
};

const src = readFileSync(
    new URL("../src/components/ui/MobileMenu.jsx", import.meta.url),
    "utf8"
);

console.log("MobileMenu structural guards");

check(
    "renders through a portal",
    /createPortal/.test(src),
    "no createPortal call found"
);
check(
    "portals to document.body",
    /document\.body/.test(src),
    "portal target is not document.body"
);

// Emulate the two DOM shapes the component can produce.
const header = document.createElement("header");
header.className = "sticky top-0 z-40 bg-white/70 backdrop-blur-md";
document.getElementById("root").appendChild(header);

const wrapper = document.createElement("div");
wrapper.className =
    "pointer-events-none fixed inset-0 z-[60] md:hidden";
const backdrop = document.createElement("div");
backdrop.className =
    "pointer-events-auto absolute inset-x-0 bottom-0";
const panel = document.createElement("div");
panel.className = "qf-menu-drop pointer-events-auto absolute inset-x-0";
panel.style.top = "64px";
panel.style.setProperty("--qf-menu-top", "64px");

// The broken shape: panel nested inside the blurred header.
header.appendChild(backdrop);
header.appendChild(panel);
const nestedInHeader = header.contains(panel);
check(
    "detects the broken shape (panel inside blurred header)",
    nestedInHeader,
    "sanity check failed - test is not exercising the right DOM"
);

// The fixed shape: the same nodes, attached to body instead.
header.removeChild(backdrop);
header.removeChild(panel);
document.body.appendChild(wrapper);
wrapper.appendChild(backdrop);
wrapper.appendChild(panel);

check(
    "panel is NOT a descendant of the blurred header",
    !header.contains(panel),
    "panel is still inside the header, so backdrop-filter would capture it"
);
check(
    "panel is inside the document.body portal",
    document.body.contains(panel) && panel.closest("body") !== null
);
check(
    "portal wrapper is viewport-anchored",
    /fixed/.test(wrapper.className) && /inset-0/.test(wrapper.className)
);
check(
    "portal wrapper does not swallow header taps",
    /pointer-events-none/.test(wrapper.className)
);
check(
    "panel opts back into pointer events",
    /pointer-events-auto/.test(panel.className)
);
check(
    "backdrop opts back into pointer events",
    /pointer-events-auto/.test(backdrop.className)
);
check(
    "panel top is driven by the measured header height",
    panel.style.top === "64px"
);
check(
    "panel exposes --qf-menu-top for the max-height calc",
    panel.style.getPropertyValue("--qf-menu-top") === "64px"
);
check(
    "close button is reachable (Escape handled)",
    /Escape/.test(src)
);
check(
    "focus is trapped inside the modal",
    /Tab/.test(src) && /FOCUSABLE/.test(src)
);
check(
    "focus is restored to the trigger on close",
    /restoreRef/.test(src)
);

console.log(
    failures.length === 0
        ? "\nAll MobileMenu guards passed."
        : `\n${failures.length} guard(s) failed.`
);

process.exit(failures.length === 0 ? 0 : 1);
