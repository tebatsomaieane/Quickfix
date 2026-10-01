/**
 * Guards the route -> document title mapping.
 *
 * Two failure modes matter here and neither shows up as a crash:
 *
 *   1. Ordering. `/customer/requests/new` also matches a
 *      `/customer/requests/:id` pattern, so a literal route listed after a
 *      parameterised one silently gets the wrong title.
 *   2. Completeness. A new route added to App.jsx with no entry here quietly
 *      falls through to "Page not found", which is a worse lie than no title
 *      at all. The completeness check below reads the real route table so that
 *      cannot happen unnoticed.
 */
import { readFileSync } from "node:fs";
import { titleForPath, documentTitleFor, HOME_TITLE, BRAND } from "../src/lib/routeTitles.js";

const failures = [];
const check = (name, condition, detail = "") => {
    if (condition) {
        console.log(`  PASS  ${name}`);
    } else {
        console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
        failures.push(name);
    }
};

console.log("Route title mapping");

// --- Literal routes beat parameterised ones ---------------------------------
check(
    "'/customer/requests/new' is not swallowed by ':id'",
    titleForPath("/customer/requests/new") === "New service request",
    titleForPath("/customer/requests/new")
);
check(
    "'/customer/services' is not read as a category",
    titleForPath("/customer/services") === "Services",
    titleForPath("/customer/services")
);
check(
    "'/customer/requests/123' is a detail page",
    titleForPath("/customer/requests/123") === "Request details",
    titleForPath("/customer/requests/123")
);
check(
    "'/customer/services/7' is a category",
    titleForPath("/customer/services/7") === "Service category",
    titleForPath("/customer/services/7")
);
check(
    "'/customer/review/42' is a review",
    titleForPath("/customer/review/42") === "Leave a review",
    titleForPath("/customer/review/42")
);

// --- Shared sub-pages resolve for every role --------------------------------
for (const role of ["customer", "provider", "business", "admin"]) {
    check(
        `${role} settings`,
        titleForPath(`/${role}/settings`) === "Settings",
        titleForPath(`/${role}/settings`)
    );
    check(
        `${role} messages`,
        titleForPath(`/${role}/messages`) === "Messages",
        titleForPath(`/${role}/messages`)
    );
}

// --- Brand suffix -----------------------------------------------------------
check(
    "home keeps the full marketing title",
    documentTitleFor("/") === `${BRAND} — ${HOME_TITLE}`,
    documentTitleFor("/")
);
check(
    "other pages get the '· QuickFix' suffix",
    documentTitleFor("/login") === "Log in · QuickFix",
    documentTitleFor("/login")
);
check(
    "title is never empty",
    documentTitleFor("/customer/dashboard").endsWith(BRAND),
    documentTitleFor("/customer/dashboard")
);

// --- Trailing slash / empty input ------------------------------------------
check(
    "trailing slash resolves the same",
    titleForPath("/login/") === "Log in",
    titleForPath("/login/")
);
check(
    "root with trailing slash is still home",
    titleForPath("/") === HOME_TITLE
);
check(
    "empty path falls back to home",
    titleForPath("") === HOME_TITLE,
    titleForPath("")
);

// --- Unknown routes ---------------------------------------------------------
check(
    "unknown path reports not found",
    titleForPath("/definitely-not-a-route") === "Page not found",
    titleForPath("/definitely-not-a-route")
);

// --- Completeness against the real route table ------------------------------
const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const declared = [...appSource.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);

// Wildcards intentionally fall through to the placeholder / not-found titles.
const wildcards = new Set(declared.filter((p) => p.includes("*")));
const concrete = declared.filter((p) => !p.includes("*"));

const unmapped = concrete.filter(
    (p) =>
        // Substitute a sample value for dynamic segments.
        titleForPath(p.replace(/:[^/]+/g, "1")) === "Page not found"
);

check(
    `all ${concrete.length} concrete routes have a title`,
    unmapped.length === 0,
    unmapped.join(", ")
);
check(
    "route table was actually parsed",
    declared.length > 30,
    `only found ${declared.length} paths`
);
check(
    "wildcards are present and handled",
    wildcards.size > 0
);

// Every title should be a single readable line, not a raw path or id.
const ugly = concrete
    .map((p) => p.replace(/:[^/]+/g, "1"))
    .map((p) => titleForPath(p))
    .filter((t) => /[/:]/.test(t));

check("no title leaks a path or parameter", ugly.length === 0, ugly.join(", "));

console.log(
    failures.length === 0
        ? "\nAll route title checks passed."
        : `\n${failures.length} check(s) failed.`
);

process.exit(failures.length === 0 ? 0 : 1);
