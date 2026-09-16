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

const sendPasswordResetEmail = async (to, resetToken) => {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    if (!isEmailConfigured()) {
        console.warn(
            "[mail] SMTP not configured - password reset link for",
            to,
            "not sent. Link:",
            resetUrl
        );
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
    sendMail,
    sendPasswordResetEmail
};