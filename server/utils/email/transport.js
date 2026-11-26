// Transport selection for outgoing mail.
//
// Three transports exist:
//
//   apps-script - real delivery through a Gmail-backed Apps Script webhook.
//   smtp        - real delivery through nodemailer. Used when SMTP_* is set.
//   capture     - delivers nowhere. The outbox records the rendered message so
//                 it can be inspected during development. Development/test
//                 only; it is refused in production so a misconfigured deploy
//                 cannot silently swallow account emails.
//
// EMAIL_TRANSPORT or EMAIL_PROVIDER picks one explicitly
// ("apps-script" | "smtp" | "capture"); the default "auto" prefers Apps Script,
// then SMTP, and falls back to capture outside production. Nothing here reads a
// secret at import time beyond the env it is handed, so tests can exercise
// every branch with a fake env.

const dns = require("dns");
const net = require("net");
const nodemailer = require("nodemailer");
const { appsScriptConfigured, appsScriptTransport } = require("./appsScript");

const DEFAULT_FROM = "QuickFix <no-reply@quickfix.co.ls>";

const smtpSettings = (env) => ({
    host: env.SMTP_HOST || "",
    port: Number(env.SMTP_PORT) || 587,
    secure: String(env.SMTP_SECURE || "").toLowerCase() === "true",
    user: env.SMTP_USER || "",
    password: env.SMTP_PASSWORD || "",
    from: env.SMTP_FROM || DEFAULT_FROM
});

const resolveConnectionHost = async (host) => {
    if (net.isIP(host)) {
        return host;
    }

    const addresses = await dns.promises.resolve4(host).catch(() => []);

    return addresses[0] || host;
};

const smtpConfigured = (env = process.env) => {
    const settings = smtpSettings(env);

    return Boolean(settings.host && settings.user && settings.password);
};

// Which transport a send will use. Exported so the outbox and the tests can
// reason about delivery without constructing a transport.
const resolveMode = (env = process.env) => {
    const requested = String(
        env.EMAIL_TRANSPORT || env.EMAIL_PROVIDER || "auto"
    ).toLowerCase();

    if (
        requested === "smtp" ||
        requested === "capture" ||
        requested === "apps-script"
    ) {
        return requested;
    }

    if (appsScriptConfigured(env)) {
        return "apps-script";
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

    if (mode === "apps-script") {
        return appsScriptConfigured(env);
    }

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
let smtpKey = null;

const getSmtpTransporter = async (env = process.env) => {
    const settings = smtpSettings(env);
    const key = `${settings.host}|${settings.port}|${settings.user}`;

    if (smtpTransporter && smtpKey === key) {
        return smtpTransporter;
    }

    const connectionHost = await resolveConnectionHost(settings.host);

    smtpTransporter = nodemailer.createTransport({
        host: connectionHost,
        port: settings.port,
        secure: settings.secure,
        requireTLS: true,
        tls: {
            servername: settings.host
        },
        auth: {
            user: settings.user,
            pass: settings.password
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000
    });
    smtpKey = key;

    return smtpTransporter;
};

// Test hook: drop the cached transporter so a fresh env/transport is built.
const resetSmtpTransporter = () => {
    smtpTransporter = null;
    smtpKey = null;
};

const createSmtpTransport = (env = process.env) => ({
    name: "smtp",
    async send({ to, subject, text, html }) {
        const settings = smtpSettings(env);
        const transporter = await getSmtpTransporter(env);
        const info = await transporter.sendMail({
            from: settings.from,
            to,
            subject,
            text,
            html
        });

        return { captured: false, messageId: info.messageId };
    }
});

const getTransport = (env = process.env) => {
    const mode = resolveMode(env);

    if (mode === "apps-script") {
        return appsScriptTransport(env);
    }

    return mode === "capture" ? captureTransport : createSmtpTransport(env);
};

module.exports = {
    resolveMode,
    canDeliver,
    smtpConfigured,
    getTransport,
    createSmtpTransport,
    captureTransport,
    resetSmtpTransporter
};
