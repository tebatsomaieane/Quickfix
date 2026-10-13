// Per-query inactivity timeout for mysql2.
//
// mysql2 accepts a `timeout` on an individual query, but it has no pool-wide
// option for it: passing `timeout` to createPool logs an "invalid configuration
// option" warning and is then ignored. Left unapplied, a single query stuck on
// a lock wait holds its pooled connection until the server releases it, and
// under load the waiters queue up behind it until every request times out
// somewhere upstream.
//
// These helpers apply a default timeout to every query and execute call on a
// pool and on the connections it hands out, so the protection covers the whole
// codebase without every caller having to remember it.

const DEFAULT_QUERY_TIMEOUT_MS = 15000;

// Rewrite a query/execute call into the argument list mysql2's promise layer
// expects, adding a default timeout. mysql2 accepts either (sql, values) or
// (options, values); an explicit per-call timeout is never overridden.
function withTimeout(sqlOrOptions, values, timeoutMs = DEFAULT_QUERY_TIMEOUT_MS) {
    if (typeof sqlOrOptions === "string") {
        const options = { sql: sqlOrOptions, timeout: timeoutMs };

        if (values !== undefined) {
            options.values = values;
        }

        return [options];
    }

    if (
        sqlOrOptions &&
        typeof sqlOrOptions === "object" &&
        typeof sqlOrOptions.sql === "string"
    ) {
        // Spread the caller's options last so an explicit `timeout` wins.
        const options = { timeout: timeoutMs, ...sqlOrOptions };

        return values === undefined ? [options] : [options, values];
    }

    // Anything else (a pre-built command, a non-string first argument) is left
    // untouched rather than guessed at.
    return [sqlOrOptions, values];
}

// Wrap query/execute on a pool or connection so each call carries a default
// timeout. Returns the same target for convenient chaining.
function applyQueryTimeout(target, timeoutMs = DEFAULT_QUERY_TIMEOUT_MS) {
    for (const method of ["query", "execute"]) {
        const original = target[method];

        if (typeof original !== "function") {
            continue;
        }

        target[method] = function (...args) {
            return original.apply(
                this,
                withTimeout(args[0], args[1], timeoutMs)
            );
        };
    }

    return target;
}

module.exports = {
    withTimeout,
    applyQueryTimeout,
    DEFAULT_QUERY_TIMEOUT_MS
};
