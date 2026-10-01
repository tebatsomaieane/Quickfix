const express = require("express");

const {
    register,
    login,
    me,
    session,
    updateProfile,
    logout,
    changePassword,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerification,
    verifyTwoFactor,
    resendOtp
} = require("../controllers/authController");

const {
    protect
} = require("../middleware/authMiddleware");

const rateLimit = require("../middleware/rateLimit");
const { validate } = require("../validators");
const { auth } = require("../validators/schemas");

const router = express.Router();

// Sign-in budget, raised because a shared public IP (campus/mobile CGNAT) can
// put many real users behind one limiter key. Overridable per environment
// without a code change; the window stays fixed so the cap still bounds
// brute-force attempts per account.
const LOGIN_MAX_ATTEMPTS = Number.parseInt(
    process.env.LOGIN_RATE_LIMIT_MAX,
    10
) || 100;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Every public auth route validates its body before the controller runs, so a
// malformed request is answered from the schema alone -- no database round
// trip, no bcrypt, no email. Each rejection comes back as
// `{ message, errors: { field } }`, which is what lets the client put the
// problem on the input that caused it.
router.post(
    "/register",
    rateLimit({ max: 10, windowMs: 60 * 60 * 1000 }),
    validate(auth.register),
    register
);
router.post(
    "/login",
    rateLimit({ max: LOGIN_MAX_ATTEMPTS, windowMs: LOGIN_WINDOW_MS }),
    validate(auth.login),
    login
);
router.post(
    "/verify-email",
    rateLimit({ max: 10 }),
    validate(auth.verifyEmail),
    verifyEmail
);
router.post(
    "/resend-verification",
    rateLimit({ max: 5 }),
    validate(auth.resend),
    resendVerification
);
router.post(
    "/verify-2fa",
    rateLimit({ max: 10 }),
    validate(auth.verifyTwoFactor),
    verifyTwoFactor
);
router.post(
    "/resend-otp",
    rateLimit({ max: 5 }),
    validate(auth.resend),
    resendOtp
);
router.get("/me", protect, me);
router.get("/session", session);
router.patch("/profile", protect, validate(auth.updateProfile), updateProfile);
router.post("/logout", logout);
router.post(
    "/change-password",
    protect,
    rateLimit({ max: 10 }),
    validate(auth.changePassword, {
        // Cross-field, so it cannot be a per-field rule. Reported against
        // `new_password` because that is the input the user has to change.
        refine: (values) =>
            values.current_password === values.new_password
                ? { new_password: "Your new password must be different from your current one" }
                : undefined
    }),
    changePassword
);
router.post(
    "/forgot-password",
    rateLimit({ max: 5 }),
    validate(auth.forgotPassword),
    requestPasswordReset
);
router.post(
    "/reset-password",
    rateLimit({ max: 5 }),
    validate(auth.resetPassword),
    resetPassword
);

module.exports = router;
