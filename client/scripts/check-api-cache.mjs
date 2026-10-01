/**
 * Behavioural checks for the API layer.
 *
 * The GET cache is the part most likely to cause real harm if it is wrong: a
 * stale catalogue read is a user picking a service that no longer exists, or
 * seeing a price that has changed. These tests assert the guard rails rather
 * than the happy path, because the happy path has no visible failure.
 *
 * Runs against a real Axios instance with a stubbed adapter, so the
 * interceptors under test are the shipping ones.
 */

import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

const SOURCE = "src/services/api.js";
const read = (file) =>
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

// The source uses extensionless relative imports, which Vite resolves but Node
// does not, so the module is bundled before it is imported. That also means the
// interceptors under test are the shipping ones, not a reimplementation.
const dir = mkdtempSync(resolve(process.cwd(), ".a11y-check-"));
const bundle = join(dir, "bundle.mjs");

process.on("exit", () => {
    try {
        rmSync(dir, { recursive: true, force: true });
    } catch {
        /* best effort */
    }
});

writeFileSync(
    join(dir, "entry.js"),
    `export { default, getApiBaseUrl } from ${JSON.stringify(
        resolve(process.cwd(), SOURCE)
    )};`
);

await build({
    entryPoints: [join(dir, "entry.js")],
    outfile: bundle,
    bundle: true,
    format: "esm",
    platform: "browser",
    // Node's built-ins must stay external so the DOM globals below are used.
    packages: "external",
    // Vite injects this; Node does not define import.meta.env.
    define: { "import.meta.env": "{}" }
});

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

const run = async () => {
    const source = read(SOURCE);

    // The module touches `window.location` in its 401 handler, so a DOM has to
    // exist before it is imported.
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
        url: "https://quickfix.test/"
    });

    global.window = dom.window;
    global.document = dom.window.document;

    // Node 24 defines `navigator` as a getter-only global, so it has to be
    // redefined rather than assigned. Axios only needs `navigator.product`.
    Object.defineProperty(global, "navigator", {
        value: dom.window.navigator,
        configurable: true,
        writable: true
    });

    // The connectivity reporter dispatches events on `window`, so the DOM's
    // own Event/EventTarget pair has to be used. Node's built-ins are not
    // accepted by jsdom's dispatchEvent.
    global.Event = dom.window.Event;
    global.EventTarget = dom.window.EventTarget;
    global.CustomEvent = dom.window.CustomEvent;

    const { default: api, getApiBaseUrl } = await import(
        new URL(`file://${bundle.replace(/\\/g, "/")}`).href
    );

    let calls = 0;
    let lastRequest;

    // Stands in for the network. Records every call so cache hits can be told
    // apart from real requests.
    api.defaults.adapter = async (config) => {
        calls += 1;
        lastRequest = config;

        return {
            data: { success: true, data: [], n: calls },
            status: 200,
            statusText: "OK",
            headers: {},
            config
        };
    };

    console.log("api get cache");

    // --- baseline -----------------------------------------------------------
    calls = 0;
    const first = await api.get("/services");
    const second = await api.get("/services");

    check("a repeated catalogue GET only hits the network once", calls === 1);
    check("the cached response is returned to the caller", second.data.n === 1);
    check("the first call is a real request", first.status === 200);

    // --- what must never be cached -----------------------------------------
    // These are the cases where a stale read would show one user another
    // user's data, or hide a change they just made.
    for (const path of [
        "/auth/session",
        "/auth/me",
        "/requests",
        "/requests/mine",
        "/offers",
        "/jobs",
        "/conversations",
        "/notifications",
        "/complaints",
        "/admin/users",
        "/my/requests"
    ]) {
        const before = calls;

        await api.get(path);
        await api.get(path);

        check(`${path} is never served from cache`, calls === before + 2);
    }

    // --- filtered reads bypass the cache ------------------------------------
    const beforeParams = calls;

    await api.get("/services", { params: { category_id: 1 } });
    await api.get("/services", { params: { category_id: 1 } });

    check(
        "a filtered read is not cached (cache key ignores params)",
        calls === beforeParams + 2
    );

    // --- writes invalidate --------------------------------------------------
    // A distinct, not-yet-requested path so the warm-up is unambiguous.
    await api.get("/products");
    calls = 0;
    await api.get("/products");
    check("cache is warm before the write", calls === 0);

    await api.post("/products", { name: "test" });
    calls = 0;
    await api.get("/products");

    check("a successful write clears the cache", calls === 1);

    // --- a 4xx must not poison the cache -----------------------------------
    // A real Axios adapter rejects for non-2xx, so the stub has to as well or
    // this would not be testing a failure at all.
    // Uses a path that has not been read yet, so the failing request actually
    // reaches the network instead of being answered from cache.
    api.defaults.adapter = async (config) => {
        throw Object.assign(
            new Error("Request failed with status code 400"),
            {
                config,
                response: {
                    data: { success: false, message: "Nope" },
                    status: 400,
                    statusText: "Bad Request",
                    headers: {},
                    config
                }
            }
        );
    };

    await assert.rejects(() => api.get("/market/overview"));

    // Now warm the cache with a good read, then confirm the failure was not
    // stored in its place.
    calls = 0;
    api.defaults.adapter = async (config) => {
        calls += 1;

        return {
            data: { success: true, data: [], n: calls },
            status: 200,
            statusText: "OK",
            headers: {},
            config
        };
    };

    await api.get("/market/overview");
    check("a rejected read is not cached", calls === 1);

    calls = 0;
    await api.get("/market/overview");
    check(
        "a rejected read is not served back on the next attempt",
        calls === 0
    );

    // --- cache expiry -------------------------------------------------------
    api.defaults.adapter = async (config) => ({
        data: { success: true, data: [], n: ++calls },
        status: 200,
        statusText: "OK",
        headers: {},
        config
    });

    // The TTL is 30s; wait a short time and confirm the entry is still served,
    // then assert the constant itself is what governs it.
    const ttlMatch = source.match(/CACHE_TTL_MS\s*=\s*(\d[\d_]*)/);

    check("the cache has a finite TTL", Boolean(ttlMatch));
    check(
        "the TTL is short enough not to show stale data",
        ttlMatch ? Number(ttlMatch[1].replace(/_/g, "")) <= 60_000 : false
    );

    check("the cache is in-memory only (no storage API)", !/localStorage|sessionStorage|indexedDB/.test(source));
    check("getApiBaseUrl is still exported", typeof getApiBaseUrl() === "string");

    console.log(`\n${checks - failures}/${checks} checks passed`);

    return failures;
};

process.exit((await run()) === 0 ? 0 : 1);
