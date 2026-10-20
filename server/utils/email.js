// Public email API.
//
// Callers keep the same three functions they always used, but a send is now a
// durable enqueue rather than an inline SMTP call. `isEmailConfigured()` now
// means "a transport can actually deliver" (SMTP credentials, or the
// development capture transport), so the 2FA/reset controllers keep making the
// same decision.
//
// Secrets in the payload (the OTP, the reset link) are cleared from the outbox
// row once the message reaches a terminal state -- see outbox.js.

const { canDeliver, resolveMode } = require("./email/transport");
const { enqueue } = require("./email/outbox");

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const APP_URL = (
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_ORIGIN ||
    "http://localhost:5173"
).replace(/\/+$/, "");

// Thrown when a caller asked for an email that cannot be delivered, so the
// controller can report the failure instead of telling the user a code was
// sent. Kept exported so existing `instanceof` handling is unchanged.
class EmailDeliveryError extends Error {
    constructor(message, code) {
        super(message);
        this.name = "EmailDeliveryError";
        this.code = code;
    }
}

// "Can an email actually get out right now?" -- true with SMTP credentials, or
// with the capture transport outside production.
const isEmailConfigured = () => canDeliver();

const assertDeliverable = () => {
    if (!canDeliver()) {
        throw new EmailDeliveryError(
            "Email delivery is unavailable: no transport is configured",
            "EMAIL_DELIVERY_UNAVAILABLE"
        );
    }
};

// In development the capture transport is used, so the code/link is echoed to
// the server log to keep the 2FA and reset flows testable without a mail
// account. Never printed when a real transport is configured, and never in
// production.
const logDev = (message) => {
    if (!IS_PRODUCTION && resolveMode() === "capture") {
        console.warn(`[mail] ${message}`);
    }
};

const enqueueMail = async ({ to, toName, template, payload }) => {
    // Fail before writing a queue row that could never be delivered, so the
    // controller's "delivery unavailable" branch still triggers.
    assertDeliverable();

    return enqueue({ to, toName, template, payload });
};

// Registration email verification PIN.
const sendEmailVerificationPin = async (to, firstName, code) => {
    logDev(`verification PIN for ${to} queued (dev: ${code})`);

    return enqueueMail({
        to,
        toName: firstName,
        template: "verify_email",
        payload: { firstName, code }
    });
};

// Email-address change PIN, sent to the proposed new address so its owner can
// prove they control the inbox before the change is applied.
const sendEmailChangePin = async (to, firstName, code) => {
    logDev(`email change PIN for ${to} queued (dev: ${code})`);

    return enqueueMail({
        to,
        toName: firstName,
        template: "email_change",
        payload: { firstName, code }
    });
};

// Login two-factor authentication code.
const sendLoginOtp = async (to, firstName, code) => {
    logDev(`login code for ${to} queued (dev: ${code})`);

    return enqueueMail({
        to,
        toName: firstName,
        template: "login_otp",
        payload: { firstName, code }
    });
};

const sendPasswordResetEmail = async (to, resetToken) => {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    logDev(`password reset for ${to} queued. Link: ${resetUrl}`);

    return enqueueMail({
        to,
        template: "password_reset",
        payload: { resetUrl }
    });
};

// Welcome mail after a successful sign-up. Not wired into the controller yet;
// exported so the next feature can use it without another change here.
const sendWelcome = async (to, firstName) =>
    enqueueMail({
        to,
        toName: firstName,
        template: "welcome",
        payload: { firstName }
    });

// Security notice about an account change (password changed/reset, two-factor
// toggled). `when` is an optional human-readable timestamp supplied by the
// caller, keeping this module free of the clock.
const sendSecurityAlert = async (to, firstName, { action, when } = {}) =>
    enqueueMail({
        to,
        toName: firstName,
        template: "security_alert",
        payload: { firstName, action, when }
    });

// Low-level escape hatch for internal/system mail with finished parts.
const sendMail = async ({ to, subject, text, html }) =>
    enqueueMail({
        to,
        template: "raw",
        payload: { subject, text, html }
    });

module.exports = {
    isEmailConfigured,
    canDeliver,
    EmailDeliveryError,
    sendMail,
    sendEmailVerificationPin,
    sendEmailChangePin,
    sendLoginOtp,
    sendPasswordResetEmail,
    sendWelcome,
    sendSecurityAlert
};
