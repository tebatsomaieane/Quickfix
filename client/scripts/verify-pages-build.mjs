/**
 * Fails a Cloudflare Pages build whose bundle would call its own origin.
 *
 * Pages serves static files only: there is no server behind /api there, so a
 * bundle whose axios base is "/api" answers every write with 405 and every read
 * with the SPA shell (HTML where JSON was expected). That is exactly what a
 * publish without VITE_API_URL produces, and it is invisible in the source --
 * api.js falls back to "/api" on purpose for the nginx/docker same-origin
 * deploys. Only the published bundle can tell the two apart.
 *
 * The workflow validates VITE_API_URL before building, but this runs against
 * the artifacts, so it also catches a manual `wrangler pages deploy` from a
 * checkout that never saw the variable -- which is how the broken build in the
 * first place reached production.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "vite";

const fail = (message) => {
    console.error(`  FAIL  ${message}`);
    process.exit(1);
};

const distDir = resolve(process.cwd(), "dist");

if (!existsSync(distDir)) {
    fail("dist/ does not exist - run `npm run build` first.");
}

// Same inputs `vite build` had: the shell variable wins, then .env.production.
const env = loadEnv("production", process.cwd(), "");
const apiBase = (process.env.VITE_API_URL || env.VITE_API_URL || "").replace(/\/+$/, "");

if (!apiBase) {
    fail(
        "VITE_API_URL is not set. Pages cannot serve /api, so the build would " +
            "call its own origin and every request would fail (405 on POST). " +
            "Set VITE_API_URL to the API origin, e.g. " +
            "https://your-api.up.railway.app/api"
    );
}

if (!/^https:\/\//.test(apiBase)) {
    fail(`VITE_API_URL must be an https:// origin, got: ${apiBase}`);
}

const origin = new URL(apiBase).origin;

const assets = readdirSync(resolve(distDir, "assets")).filter((name) => name.endsWith(".js"));

if (assets.length === 0) {
    fail("dist/assets contains no JavaScript - the build output is incomplete.");
}

// Every chunk that could hold the API client is scanned: the entry point is
// split differently on every build, so filename-based guessing would rot.
const referencesOrigin = assets.some((name) =>
    readFileSync(resolve(distDir, "assets", name), "utf8").includes(origin)
);

if (!referencesOrigin) {
    fail(
        `No asset in dist/ references ${origin}. The bundle was built without ` +
            "VITE_API_URL and would POST to this same origin, where Pages answers 405."
    );
}

console.log(`  PASS  bundle targets ${origin}`);
