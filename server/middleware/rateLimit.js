// Simple in-memory sliding-window rate limiter.
// Suitable for single-process deployments. Not for multi-instance scales.

const windowEntries = new Map();

const DEFAULT_OPTIONS = {
    windowMs: 15 * 60 * 1000,
    max: 20,
    // Says what to do, not just what happened. The paired `Retry-After` header
    // carries the exact number of seconds.
    message: "Too many attempts. Please wait a moment and try again.",
    // Trusted loopback traffic (dev tooling, CI, health checks) is exempt.
    // In production behind a reverse proxy this should usually stay false
    // so that all clients are rate limited consistently.
    skipLoopback: process.env.NODE_ENV !== "production"
};

const LOOPBACK_IPS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

const getClientKey = (req) => {
    return req.ip ||
        (req.socket && req.socket.remoteAddress) ||
        "unknown";
};

const rateLimit = (options = {}) => {
    const config = { ...DEFAULT_OPTIONS, ...options };

    return (req, res, next) => {
        const ip = getClientKey(req);

        if (config.skipLoopback && LOOPBACK_IPS.has(ip)) {
            return next();
        }

        const key = ip;
        const now = Date.now();

        const entries = windowEntries.get(key) || [];
        const active = entries.filter((ts) => now - ts < config.windowMs);

        // Standard rate-limit headers, so a client (or an operator reading a
        // network trace) can see the budget rather than having to guess at it.
        const oldest = active.length > 0 ? active[0] : now;
        res.setHeader("RateLimit-Limit", String(config.max));
        res.setHeader(
            "RateLimit-Remaining",
            String(Math.max(0, config.max - active.length))
        );
        res.setHeader(
            "RateLimit-Reset",
            String(Math.ceil((oldest + config.windowMs - now) / 1000))
        );

        if (active.length >= config.max) {
            // `Retry-After` is how the browser is meant to learn when it may try
            // again, and it is the difference between a client that waits and
            // one that hammers a limit it cannot see.
            const retryAfterSeconds = Math.max(
                1,
                Math.ceil((oldest + config.windowMs - now) / 1000)
            );

            res.setHeader("Retry-After", String(retryAfterSeconds));

            return res.status(429).json({
                success: false,
                message: config.message,
                retryAfter: retryAfterSeconds
            });
        }

        active.push(now);
        windowEntries.set(key, active);

        // Prevent unbounded memory growth: periodically prune expired
        // timestamps from every entry, not just fully-expired entries.
        if (windowEntries.size > 10000 || (windowEntries.size & 511) === 0) {
            for (const [entryKey, entryTimes] of windowEntries) {
                const remaining = entryTimes.filter(
                    (ts) => now - ts < config.windowMs
                );

                if (remaining.length === 0) {
                    windowEntries.delete(entryKey);
                } else if (remaining.length !== entryTimes.length) {
                    windowEntries.set(entryKey, remaining);
                }
            }
        }

        next();
    };
};

module.exports = rateLimit;