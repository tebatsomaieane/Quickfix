// Rendering for transactional email.
//
// Each template is a pure function of its payload: given the same data it
// returns the same { subject, text, html }. Nothing here reads env, the
// database or the clock, which is what makes the whole set unit-testable and
// keeps personalisation out of the delivery path.

const BRAND_NAME = "QuickFix";
const BRAND_LOCATION = "Maseru, Lesotho";
const SUPPORT_LINE = `${BRAND_NAME} - ${BRAND_LOCATION}`;

// Every value interpolated into HTML goes through this first. Names and links
// are user-controlled in places, so an unescaped name would be an injection
// vector inside a mail client that renders HTML.
const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => {
        switch (char) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case '"':
                return "&quot;";
            case "'":
                return "&#39;";
            default:
                return char;
        }
    });

const wrapHtml = (inner) =>
    [
        "<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#334155\">",
        inner,
        `<p style="color:#94a3b8;font-size:12px;margin-top:24px">${BRAND_NAME} &middot; ${BRAND_LOCATION}</p>`,
        "</div>"
    ].join("\n");

const otpTemplate = ({
    subject,
    heading,
    body,
    firstName,
    code,
    expiresInMinutes
}) => {
    const text = [
        `Hi ${firstName},`,
        "",
        body,
        "",
        `Your ${BRAND_NAME} code is: ${code}`,
        "",
        `This code expires in ${expiresInMinutes} minutes.`,
        "",
        "If you did not request this, you can safely ignore this email.",
        "",
        SUPPORT_LINE
    ].join("\n");

    const html = wrapHtml(
        [
            `<h2 style="color:#1e293b">${escapeHtml(heading)}</h2>`,
            `<p style="color:#475569">Hi ${escapeHtml(firstName)},</p>`,
            `<p style="color:#475569">${escapeHtml(body)}</p>`,
            `<p style="text-align:center;margin:24px 0"><span style="display:inline-block;background:#eef2ff;color:#4338ca;font-size:28px;font-weight:700;letter-spacing:8px;padding:14px 22px;border-radius:12px">${escapeHtml(code)}</span></p>`,
            `<p style="color:#64748b;font-size:13px">This code expires in ${expiresInMinutes} minutes. If you did not request this, you can safely ignore this email.</p>`
        ].join("\n")
    );

    return { subject, text, html };
};

const passwordResetTemplate = ({ resetUrl }) => {
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
        SUPPORT_LINE
    ].join("\n");

    const html = wrapHtml(
        [
            "<h2 style=\"color:#1e293b\">Reset your QuickFix password</h2>",
            "<p style=\"color:#475569\">You requested to reset your QuickFix password. Click the button below to choose a new one (valid for 1 hour):</p>",
            `<p style="text-align:center;margin:24px 0"><a href="${escapeHtml(resetUrl)}" style="background:#4f46e5;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none">Reset password</a></p>`,
            "<p style=\"color:#64748b;font-size:13px\">If the button does not work, copy and paste this link into your browser:</p>",
            `<p style="color:#4f46e5;font-size:13px;word-break:break-all">${escapeHtml(resetUrl)}</p>`,
            "<p style=\"color:#64748b;font-size:13px\">If you did not request this, you can safely ignore this email.</p>"
        ].join("\n")
    );

    return { subject: "Reset your QuickFix password", text, html };
};

const welcomeTemplate = ({ firstName }) => {
    const text = [
        `Hi ${firstName},`,
        "",
        `Welcome to ${BRAND_NAME}! Your account is ready.`,
        "",
        "Sign in to post a request, compare offers, and get the job done.",
        "",
        "If you have any trouble, just reply to this email.",
        "",
        SUPPORT_LINE
    ].join("\n");

    const html = wrapHtml(
        [
            `<h2 style="color:#1e293b">Welcome to ${BRAND_NAME}, ${escapeHtml(firstName)}</h2>`,
            "<p style=\"color:#475569\">Your account is ready. Sign in to post a request, compare offers, and get the job done.</p>",
            "<p style=\"color:#64748b;font-size:13px\">If you have any trouble, just reply to this email.</p>"
        ].join("\n")
    );

    return { subject: `Welcome to ${BRAND_NAME}`, text, html };
};

// A passthrough used by the low-level sendMail helper and for internal/system
// mail where the caller supplies the finished parts.
const rawTemplate = ({ subject, text, html }) => ({
    subject,
    text: text || "",
    html: html || text || ""
});

// A notification about a change to the account's security settings (password
// changed/reset, two-factor toggled). Not an OTP: it tells the rightful owner
// what just happened and how to react, which is what turns a silent takeover
// into a visible one.
const securityAlertTemplate = ({ firstName, action, when }) => {
    const lines = [
        `Hi ${firstName},`,
        "",
        `${action}.`,
        ...(when ? ["", `When: ${when}`] : []),
        "",
        "If this was you, no action is needed.",
        "If you did not do this, reset your password immediately and contact support.",
        "",
        SUPPORT_LINE
    ];

    const text = lines.join("\n");

    const html = wrapHtml(
        [
            "<h2 style=\"color:#1e293b\">Security notice</h2>",
            `<p style="color:#475569">Hi ${escapeHtml(firstName)},</p>`,
            `<p style="color:#475569">${escapeHtml(action)}.</p>`,
            ...(when
                ? [`<p style="color:#64748b;font-size:13px">When: ${escapeHtml(when)}</p>`]
                : []),
            "<p style=\"color:#64748b;font-size:13px\">If this was you, no action is needed. If you did not do this, reset your password immediately and contact support.</p>"
        ].join("\n")
    );

    return { subject: `Security notice: ${action}`, text, html };
};

const TEMPLATES = {
    login_otp: (payload) =>
        otpTemplate({
            subject: "Your QuickFix login code",
            heading: "Confirm it's you",
            body: "Enter the 6-digit code below to finish signing in to QuickFix.",
            expiresInMinutes: 10,
            ...payload
        }),
    verify_email: (payload) =>
        otpTemplate({
            subject: "Verify your QuickFix account",
            heading: "Verify your email address",
            body: "Welcome to QuickFix! Enter the 6-digit PIN below to verify your email address.",
            expiresInMinutes: 10,
            ...payload
        }),
    email_change: (payload) =>
        otpTemplate({
            subject: "Confirm your new QuickFix email",
            heading: "Confirm your new email address",
            body: "Enter the 6-digit code below to finish changing the email address on your QuickFix account.",
            expiresInMinutes: 10,
            ...payload
        }),
    password_reset: passwordResetTemplate,
    welcome: welcomeTemplate,
    security_alert: securityAlertTemplate,
    raw: rawTemplate
};

const TEMPLATE_NAMES = Object.keys(TEMPLATES);

// Turns a template name + payload into the three fields a transport needs.
// Throws on an unknown template rather than sending a blank email, so a typo
// shows up immediately in the outbox row instead of as an empty message.
const renderTemplate = (name, payload = {}) => {
    const template = TEMPLATES[name];

    if (!template) {
        throw new Error(`Unknown email template: ${name}`);
    }

    return template(payload);
};

module.exports = {
    renderTemplate,
    escapeHtml,
    TEMPLATE_NAMES
};
