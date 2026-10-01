const nodemailer = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "QuickFix <no-reply@quickfix.co.ls>";

const APP_URL = (
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_ORIGIN ||
    "http://localhost:5173"
).replace(/\/+$/, "");

const isEmailConfigured = () => {
    return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);
};

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Thrown when a caller asked for an email that cannot be delivered, so the
// controller can report the failure instead of telling the user a PIN was
// sent. Silently returning would be worse than throwing: the user would sit
// in front of a code entry box waiting for a message that never arrives.
class EmailDeliveryError extends Error {
    constructor(message, code) {
        super(message);
        this.name = "EmailDeliveryError";
        this.code = code;
    }
}

// Guards a send in production, where "no SMTP configured" is a deployment
// fault rather than the intended dev shortcut of logging the code.
const assertDeliverable = () => {
    if (!IS_PRODUCTION) {
        return;
    }

    if (!isEmailConfigured()) {
        throw new EmailDeliveryError(
            "Email delivery is unavailable: SMTP is not configured",
            "EMAIL_DELIVERY_UNAVAILABLE"
        );
    }
};

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASSWORD
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000
        });
    }

    return transporter;
};

const sendMail = async ({ to, subject, text, html }) => {
    if (!isEmailConfigured()) {
        throw new Error(
            "SMTP is not configured (set SMTP_HOST, SMTP_USER and SMTP_PASSWORD)"
        );
    }

    return getTransporter().sendMail({
        from: SMTP_FROM,
        to,
        subject,
        text,
        html
    });
};

const sendOtpEmail = async ({ to, firstName, code, subject, heading, body, expiresInMinutes }) => {
    // In development/test without SMTP, surface the code in the server
    // console so the PIN/OTP flow can be exercised end-to-end without an
    // email account or domain. In production this throws instead, because
    // telling a user their PIN was sent when no mail was ever handed to a
    // mail server strands them on a code screen.
    if (!isEmailConfigured()) {
        console.warn(
            `[mail] SMTP not configured - OTP for ${to} not sent (dev: ${code}, expires in ${expiresInMinutes} min)`
        );

        assertDeliverable();

        return null;
    }

    const text = [
        `Hi ${firstName},`,
        "",
        body,
        "",
        `Your QuickFix code is: ${code}`,
        "",
        `This code expires in ${expiresInMinutes} minutes.`,
        "",
        "If you did not request this, you can safely ignore this email.",
        "",
        "QuickFix - Maseru, Lesotho"
    ].join("\n");

    const html = [
        "<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto\">",
        `<h2 style=\"color:#1e293b\">${heading}</h2>`,
        `<p style=\"color:#475569\">Hi ${firstName},</p>`,
        `<p style=\"color:#475569\">${body}</p>`,
        `<p style=\"text-align:center;margin:24px 0\"><span style=\"display:inline-block;background:#eef2ff;color:#4338ca;font-size:28px;font-weight:700;letter-spacing:8px;padding:14px 22px;border-radius:12px\">${code}</span></p>`,
        `<p style=\"color:#64748b;font-size:13px\">This code expires in ${expiresInMinutes} minutes. If you did not request this, you can safely ignore this email.</p>`,
        "<p style=\"color:#94a3b8;font-size:12px\">QuickFix &middot; Maseru, Lesotho</p>",
        "</div>"
    ].join("\n");

    return sendMail({
        to,
        subject,
        text,
        html
    });
};

// Registration email verification PIN.
const sendEmailVerificationPin = async (to, firstName, code) => {
    return sendOtpEmail({
        to,
        firstName,
        code,
        subject: "Verify your QuickFix account",
        heading: "Verify your email address",
        body: "Welcome to QuickFix! Enter the 6-digit PIN below to verify your email address.",
        expiresInMinutes: 10
    });
};

// Login two-factor authentication code.
const sendLoginOtp = async (to, firstName, code) => {
    return sendOtpEmail({
        to,
        firstName,
        code,
        subject: "Your QuickFix login code",
        heading: "Confirm it's you",
        body: "Enter the 6-digit code below to finish signing in to QuickFix.",
        expiresInMinutes: 10
    });
};

const sendPasswordResetEmail = async (to, resetToken) => {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    if (!isEmailConfigured()) {
        console.warn(
            "[mail] SMTP not configured - password reset link for",
            to,
            "not sent. Link:",
            resetUrl
        );

        assertDeliverable();

        return null;
    }

    const text = [
        "Hello,",
        "",
        "You requested to reset your QuickFix password.",
        "Click the link below to choose a new password (valid for 1 hour):",
        "",
        resetUrl,
        "",
        "If you did not request this, you can safely ignore this email.",
        "",
        "QuickFix - Maseru, Lesotho"
    ].join("\n");

    const html = [
        "<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto\">",
        "<h2 style=\"color:#1e293b\">Reset your QuickFix password</h2>",
        "<p style=\"color:#475569\">You requested to reset your QuickFix password. Click the button below to choose a new one (valid for 1 hour):</p>",
        `<p style=\"text-align:center;margin:24px 0\"><a href="${resetUrl}" style=\"background:#4f46e5;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none\">Reset password</a></p>`,
        "<p style=\"color:#64748b;font-size:13px\">If the button does not work, copy and paste this link into your browser:</p>",
        `<p style=\"color:#4f46e5;font-size:13px;word-break:break-all\">${resetUrl}</p>`,
        "<p style=\"color:#64748b;font-size:13px\">If you did not request this, you can safely ignore this email.</p>",
        "<p style=\"color:#94a3b8;font-size:12px\">QuickFix &middot; Maseru, Lesotho</p>",
        "</div>"
    ].join("\n");

    return sendMail({
        to,
        subject: "Reset your QuickFix password",
        text,
        html
    });
};

module.exports = {
    isEmailConfigured,
    EmailDeliveryError,
    sendMail,
    sendEmailVerificationPin,
    sendLoginOtp,
    sendPasswordResetEmail
};