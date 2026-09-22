const crypto = require("crypto");


const CSRF_COOKIE = "csrfToken";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const csrfCookieOptions = () => ({
    httpOnly: false,
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    secure: process.env.NODE_ENV === "production",
    // Longer than the session so a refresh doesn't invalidate 1-day sessions.
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
});


// Cross-site-safe CSRF defence.
//
// For mutating requests we require a custom header whose value must match
// the csrfToken cookie set by this server. An attacker's site cannot read
// that cross-origin cookie, and a plain HTML form cannot send custom
// headers, so forged state-changing requests fail the check.
//
// The token endpoint (GET /api/csrf) returns the token in the response body
// so a cross-origin client can read it (CORS blocks that for attackers) and
// replay it as x-csrf-token on every non-GET call.
const csrfProtection = (req, res, next) => {
    // Skip in tests so API/dependency checks keep working.
    if (process.env.NODE_ENV === "test") {
        return next();
    }

    // The token endpoint is what minted the cookie in the first place.
    if (req.path === "/api/csrf") {
        return next();
    }

    if (SAFE_METHODS.has(req.method)) {
        if (!req.cookies[CSRF_COOKIE]) {
            res.cookie(
                CSRF_COOKIE,
                crypto.randomBytes(24).toString("hex"),
                csrfCookieOptions()
            );
        }

        return next();
    }

    const cookieToken = req.cookies[CSRF_COOKIE];
    const headerToken = req.headers[CSRF_HEADER];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({
            success: false,
            code: "CSRF_TOKEN_REQUIRED",
            message: "Security token missing or invalid. Refresh the page and try again."
        });
    }

    return next();
};


module.exports = {
    csrfProtection,
    csrfCookieOptions,
    CSRF_COOKIE,
    CSRF_HEADER
};