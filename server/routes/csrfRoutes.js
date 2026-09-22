const express = require("express");
const crypto = require("crypto");

const rateLimit = require("../middleware/rateLimit");
const { csrfCookieOptions, CSRF_COOKIE } = require("../middleware/csrf");

const router = express.Router();


// GET /api/csrf — mint (or reuse) the security token and return its value.
// Called once by the client at startup; the value is replayed on every
// non-GET request via the x-csrf-token header.
router.get(
    "/",
    rateLimit({ max: 60 }),
    (req, res) => {
        const existing = req.cookies[CSRF_COOKIE];

        const token = existing || crypto.randomBytes(24).toString("hex");

        if (!existing) {
            res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
        }

        res.json({
            success: true,
            data: { token }
        });
    }
);


module.exports = router;