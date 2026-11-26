const appsScriptConfigured = (env = process.env) =>
    Boolean(env.APPS_SCRIPT_URL && env.APPS_SCRIPT_SECRET);

const appsScriptTransport = (env = process.env) => ({
    name: "apps-script",
    async send({ to, subject, text, html }) {
        const response = await fetch(env.APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                secret: env.APPS_SCRIPT_SECRET,
                to,
                subject,
                text,
                html,
                fromName: env.GMAIL_FROM_NAME || "QuickFix"
            })
        });
        const responseText = await response.text();

        let data = null;

        try {
            data = JSON.parse(responseText);
        } catch {
            data = null;
        }

        if (!response.ok || data?.ok !== true) {
            throw new Error(
                `Apps Script send failed (${response.status}): ` +
                    `${data?.error || responseText.slice(0, 500)}`
            );
        }

        return { captured: false, messageId: data.messageId || null };
    }
});

module.exports = {
    appsScriptConfigured,
    appsScriptTransport
};
