const test = require("node:test");
const assert = require("node:assert/strict");

const {
    withTimeout,
    applyQueryTimeout,
    DEFAULT_QUERY_TIMEOUT_MS
} = require("./queryTimeout");

/**
 * Tests for the per-query timeout wrapper.
 *
 * mysql2 only honours `timeout` on an individual query, so every call has to be
 * reshaped into an options object on its way through. These cases pin down that
 * reshaping: the values must survive, an explicit caller timeout must win, and
 * a call shape the wrapper does not understand must pass through untouched
 * rather than be quietly mangled into a broken query.
 */

test("a plain (sql, values) call gains a timeout and keeps its values", () => {
    const [options] = withTimeout("SELECT 1 WHERE id = ?", [7], 1234);

    assert.deepEqual(options, {
        sql: "SELECT 1 WHERE id = ?",
        values: [7],
        timeout: 1234
    });
});

test("a value-less call does not invent an empty values array", () => {
    const [options] = withTimeout("SELECT NOW()", undefined, 1234);

    assert.deepEqual(options, { sql: "SELECT NOW()", timeout: 1234 });
    assert.equal("values" in options, false);
});

test("the default timeout is used when none is supplied", () => {
    const [options] = withTimeout("SELECT 1");

    assert.equal(options.timeout, DEFAULT_QUERY_TIMEOUT_MS);
});

test("an options object is preserved and gains the default timeout", () => {
    const [options] = withTimeout(
        { sql: "SELECT 1", namedPlaceholders: true },
        undefined,
        1234
    );

    assert.deepEqual(options, {
        sql: "SELECT 1",
        namedPlaceholders: true,
        timeout: 1234
    });
});

test("an explicit per-call timeout is not overridden by the default", () => {
    const [options] = withTimeout({ sql: "SELECT 1", timeout: 50 }, undefined, 1234);

    assert.equal(options.timeout, 50);
});

test("values passed alongside an options object are still forwarded", () => {
    const args = withTimeout({ sql: "SELECT ?", timeout: 50 }, [3], 1234);

    assert.deepEqual(args, [{ sql: "SELECT ?", timeout: 50 }, [3]]);
});

test("an unrecognised first argument passes through untouched", () => {
    const sentinel = { notAQuery: true };

    assert.deepEqual(withTimeout(sentinel, [1], 1234), [sentinel, [1]]);
    assert.deepEqual(withTimeout(undefined, undefined, 1234), [undefined, undefined]);
});

test("applyQueryTimeout rewrites both query and execute on the target", () => {
    const calls = [];
    const fake = {
        query(...args) {
            calls.push(["query", args]);

            return "query-result";
        },
        execute(...args) {
            calls.push(["execute", args]);

            return "execute-result";
        }
    };

    applyQueryTimeout(fake, 999);

    assert.equal(fake.query("SELECT 1", [2]), "query-result");
    assert.equal(fake.execute("SELECT 2"), "execute-result");

    assert.deepEqual(calls, [
        ["query", [{ sql: "SELECT 1", values: [2], timeout: 999 }]],
        ["execute", [{ sql: "SELECT 2", timeout: 999 }]]
    ]);
});

test("applyQueryTimeout keeps `this` bound to the target", () => {
    const fake = {
        label: "pool",
        query() {
            return this.label;
        }
    };

    applyQueryTimeout(fake, 999);

    assert.equal(fake.query("SELECT 1"), "pool");
});

test("applyQueryTimeout leaves a target without query/execute alone", () => {
    const fake = { release() {} };

    assert.equal(applyQueryTimeout(fake, 999), fake);
    assert.equal(typeof fake.release, "function");
});
