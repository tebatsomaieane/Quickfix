/**
 * Guards the Vercel routing and security configuration.
 *
 * The bug this exists to prevent already happened: the SPA catch-all rewrite
 * `/(.*) -> /index.html` silently swallowed every `/api/...` request, so the
 * deployed app returned HTML where it expected JSON. Nothing errored visibly -
 * the page simply never loaded data. Routing order is therefore load-bearing
 * and easy to break by reordering the array, so it is asserted here.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

const config = JSON.parse(
    readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")
);

const rewrites = config.rewrites || [];
const index = (pattern) => rewrites.findIndex((r) => r.source === pattern);

const apiIndex = index("/api/:path*");
const catchAllIndex = index("/(.*)");

console.log("vercel routing");

check("an /api proxy rewrite exists", apiIndex !== -1);
check("the SPA catch-all rewrite exists", catchAllIndex !== -1);

check(
    "the /api rewrite is matched before the catch-all",
    apiIndex !== -1 &&
        catchAllIndex !== -1 &&
        apiIndex < catchAllIndex
);

check(
    "the /api rewrite proxies to an absolute API origin",
    apiIndex !== -1 &&
        /^https:\/\//.test(rewrites[apiIndex].destination) &&
        rewrites[apiIndex].destination.includes("/api/")
);

check(
    "the catch-all still serves the SPA shell",
    catchAllIndex !== -1 && rewrites[catchAllIndex].destination === "/index.html"
);

check(
    "/favicon.ico resolves instead of 404ing",
    rewrites.some((r) => r.source === "/favicon.ico")
);

console.log("");
console.log("vercel security headers");

const allHeaders = (config.headers || []).flatMap((entry) =>
    (entry.headers || []).map((h) => h.key)
);
const headerValue = (key) => {
    for (const entry of config.headers || []) {
        const found = (entry.headers || []).find((h) => h.key === key);
        if (found) return found.value;
    }
    return "";
};

check("a Content-Security-Policy is set", allHeaders.includes("Content-Security-Policy"));
check("X-Content-Type-Options is set", allHeaders.includes("X-Content-Type-Options"));
check("Referrer-Policy is set", allHeaders.includes("Referrer-Policy"));
check("Strict-Transport-Security is set", allHeaders.includes("Strict-Transport-Security"));
check("Permissions-Policy is set", allHeaders.includes("Permissions-Policy"));

const csp = headerValue("Content-Security-Policy");

// An app that can only talk to itself, but no longer loads, is not a security
// win. The build ships no inline <script>, so 'self' must be enough.
check("scripts are restricted to same-origin", /script-src 'self'/.test(csp));
check("the policy does not allow inline scripts", !/script-src[^;]*'unsafe-inline'/.test(csp));
check("objects and frames are blocked", /object-src 'none'/.test(csp) && /frame-ancestors 'none'/.test(csp));
check("the policy allows the proxied API", /connect-src[^;]*'self'/.test(csp));

console.log("");
console.log(`${checks - failures}/${checks} checks passed`);

if (failures > 0) {
    process.exit(1);
}
