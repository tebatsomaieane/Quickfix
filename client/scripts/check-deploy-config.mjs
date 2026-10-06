/**
 * Guards the deploy configuration for both publish targets.
 *
 * Two bugs this exists to prevent:
 *
 * 1. Vercel routing order. The SPA catch-all rewrite `/(.*) -> /index.html`
 *    silently swallowed every `/api/...` request, so the deployed app returned
 *    HTML where it expected JSON. Nothing errored visibly - the page simply
 *    never loaded data. Routing order is therefore load-bearing.
 *
 * 2. The Cloudflare Pages workflow was deleted after the Cloudflare secrets
 *    were never configured, leaving no Pages publish path at all while the
 *    README kept describing one. A green `npm run check` must not be possible
 *    when the advertised deploy path is missing or degraded.
 */
import { existsSync, readFileSync } from "node:fs";
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

const read = (...parts) =>
    readFileSync(resolve(process.cwd(), ...parts), "utf8");

// ─────────────────────────────────────────────
// Vercel (legacy publish target - still wired to `npm run deploy`)
// ─────────────────────────────────────────────
console.log("vercel routing");

let config = null;

try {
    config = JSON.parse(read("vercel.json"));
} catch {
    check("vercel.json is readable", false);
}

const rewrites = (config?.rewrites || []);
const index = (pattern) => rewrites.findIndex((r) => r.source === pattern);

const apiIndex = index("/api/:path*");
const catchAllIndex = index("/(.*)");

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

const allHeaders = (config?.headers || []).flatMap((entry) =>
    (entry.headers || []).map((h) => h.key)
);
const headerValue = (key) => {
    for (const entry of config?.headers || []) {
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

// ─────────────────────────────────────────────
// Cloudflare Pages (the publish target described by README.md)
// ─────────────────────────────────────────────
console.log("");
console.log("cloudflare pages workflow");

let workflow = "";

const workflowPath = resolve(process.cwd(), "..", ".github", "workflows", "deploy.yml");

if (existsSync(workflowPath)) {
    workflow = readFileSync(workflowPath, "utf8");
}

check(".github/workflows/deploy.yml exists", workflow.length > 0);
check("the workflow deploys to Cloudflare Pages", /wrangler-action@/.test(workflow));
check("the workflow publishes with `pages deploy`", /pages deploy/.test(workflow));
check("the workflow refuses to build without VITE_API_URL", /VITE_API_URL repository variable is not set/.test(workflow));
check("the workflow rejects a non-https API origin", /must be an https:\/\/ origin/.test(workflow));
check("the workflow runs lint", /npm run lint/.test(workflow));
check("the workflow runs this deploy check", /check:deploy/.test(workflow));
check(
    "the workflow verifies dist/index.html before publishing",
    /client\/dist\/index\.html/.test(workflow)
);
check(
    "the workflow verifies dist/_headers before publishing",
    /client\/dist\/_headers/.test(workflow)
);
check(
    "the workflow verifies dist/_redirects before publishing",
    /client\/dist\/_redirects/.test(workflow)
);
check(
    "PRs build but do not publish",
    /github\.event_name != 'pull_request'/.test(workflow)
);

console.log("");
console.log("cloudflare pages config");

let wrangler = "";

const wranglerPath = resolve(process.cwd(), "..", "wrangler.toml");

if (existsSync(wranglerPath)) {
    wrangler = readFileSync(wranglerPath, "utf8");
}

check("wrangler.toml exists at the repo root", wrangler.length > 0);
check(
    'wrangler.toml names the project "quickfix"',
    /name\s*=\s*"quickfix"/.test(wrangler)
);
check(
    "wrangler.toml points at client/dist",
    /pages_build_output_dir\s*=\s*"client\/dist"/.test(wrangler)
);

console.log("");
console.log("cloudflare pages headers & routing");

const redirects = read("public", "_redirects");
const headers = read("public", "_headers");

check(
    "the SPA fallback rewrites unknown paths to index.html",
    /\/\*\s+\/index\.html\s+200/.test(redirects)
);
check(
    "/api/* does not fall through to the SPA shell",
    /\/api\/\*\s+\S+\s+404/.test(redirects)
);

const headerText = headers;
const directive = (name) => {
    const match = headerText.match(new RegExp(`(?:^|;|\\n)\\s*${name}\\s+([^;\\n]+)`));
    return match ? match[1] : "";
};

check("a Content-Security-Policy is set on Pages", /Content-Security-Policy:/.test(headerText));
check("Strict-Transport-Security is set on Pages", /Strict-Transport-Security:/.test(headerText));
check("the Pages policy blocks framing", /frame-ancestors 'none'/.test(headerText));

// The directive is extracted above; this asserts it is exactly 'self' and has
// not drifted back to 'unsafe-inline' or an external CDN host.
const scriptSrc = directive("script-src");
check(
    "scripts are same-origin only on Pages",
    scriptSrc.trim() === "'self'"
);

// `connect-src 'self' https:` allows exfiltration to any HTTPS host. The API
// must be named explicitly instead.
const connectSrc = directive("connect-src");
check(
    "connect-src does not allow arbitrary https origins",
    connectSrc.length > 0 && !/(^|\s)https:($|\s)/.test(connectSrc)
);
check(
    "connect-src allows the same origin",
    /'self'/.test(connectSrc)
);

// If the SPA shell can be cached for a year, a deploy leaves browsers
// running asset references that no longer exist.
check(
    "/index.html is not cached immutably",
    !/max-age=31536000[^;]*\n\s*\/index\.html/.test(headerText) &&
        /\/index\.html[\s\S]{0,200}?max-age=0/.test(headerText)
);

console.log("");
console.log(`${checks - failures}/${checks} checks passed`);

if (failures > 0) {
    process.exit(1);
}
