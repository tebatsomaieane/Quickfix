// Transport selection for outgoing mail.
//
// Two transports exist:
//
//   smtp    - real delivery through nodemailer. Used whenever SMTP_* is set,
//             and the only transport allowed in production.
//   capture - delivers nowhere. The outbox records the rendered message so it
//             can be inspected during development. Development/test only; it
//             is refused in production so a misconfigured deploy cannot
//             silently swallow account emails.
//
// EMAIL_TRANSPORT picks one explicitly ("smtp" | "capture"); the default
// "auto" uses SMTP when configured and falls back to capture outside
// production. Nothing here reads a secret at import time beyond the env it is
// handed, so tests can exercise every branch with a fake env.

const nodemailer = require("nodemailer");

const DEFAULT_FROM = "QuickFix <no-reply@quickfix.co.ls>";

const smtpSettings = (env) => ({
    host: env.SMTP_HOST || "",
    port: Number(env.SMTP_PORT) || 587,
    secure: String(env.SMTP_SECURE || "").toLowerCase() === "true",
    user: env.SMTP_USER || "",
    password: env.SMTP_PASSWORD || "",
    from: env.SMTP_FROM || DEFAULT_FROM
});

const smtpConfigured = (env = process.env) => {
    const settings = smtpSettings(env);

    return Boolean(settings.host && settings.user && settings.password);
};

// Which transport a send will use. Exported so the outbox and the tests can
// reason about delivery without constructing a transport.
const resolveMode = (env = process.env) => {
    const requested = String(env.EMAIL_TRANSPORT || "auto").toLowerCase();

    if (requested === "smtp" || requested === "capture") {
        return requested;
    }

    if (smtpConfigured(env)) {
        return "smtp";
    }

    // Auto with no SMTP: capture in development, but never in production --
    // there it stays "smtp" so canDeliver() reports the deployment fault.
    return env.NODE_ENV === "production" ? "smtp" : "capture";
};

// Whether mail can actually be delivered right now. Callers use this to decide
// between "we've sent it" and an honest "delivery is unavailable".
const canDeliver = (env = process.env) => {
    const mode = resolveMode(env);

    if (mode === "smtp") {
        return smtpConfigured(env);
    }

    return env.NODE_ENV !== "production";
};

const captureTransport = {
    name: "capture",
    async send() {
        return {
            captured: true,
            messageId: `capture-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`
        };
    }
};

let smtpTransporter = null;

const getSmtpTransporter = (env = process.env) => {
    if (!smtpTransporter) {
        const settings = smtpSettings(env);

        smtpTransporter = nodemailer.createTransport({
            host: settings.host,
            port: settings.port,
            secure: settings.secure,
            auth: {
                user: settings.user,
                pass: settings.password
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000
        });
    }

    return smtpTransporter;
};

// Test hook: drop the cached transporter so a fresh env/transport is built.
const resetSmtpTransporter = () => {
    smtpTransporter = null;
};

const createSmtpTransport = (env = process.env) => ({
    name: "smtp",
    async send({ to, subject, text, html }) {
        const settings = smtpSettings(env);
        const info = await getSmtpTransporter(env).sendMail({
            from: settings.from,
            to,
            subject,
            text,
            html
        });

        return { captured: false, messageId: info.messageId };
    }
});

const getTransport = (env = process.env) =>
    resolveMode(env) === "capture"
        ? captureTransport
        : createSmtpTransport(env);

module.exports = {
    resolveMode,
    canDeliver,
    smtpConfigured,
    getTransport,
    createSmtpTransport,
    captureTransport,
    resetSmtpTransporter
};
