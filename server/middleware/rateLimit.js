// Simple in-memory sliding-window rate limiter.
// Suitable for single-process deployments. Not for multi-instance scales.

const windowEntries = new Map();

const DEFAULT_OPTIONS = {
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many attempts. Please try again later.",
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

        if (active.length >= config.max) {
            return res.status(429).json({
                success: false,
                message: config.message
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