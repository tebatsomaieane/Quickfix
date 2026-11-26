const test = require("node:test");
const assert = require("node:assert/strict");

const { appsScriptConfigured, appsScriptTransport } = require("./appsScript");

test("Apps Script requires a webhook URL and shared secret", () => {
    assert.equal(appsScriptConfigured({}), false);
    assert.equal(appsScriptConfigured({ APPS_SCRIPT_URL: "url" }), false);
    assert.equal(
        appsScriptConfigured({
            APPS_SCRIPT_URL: "url",
            APPS_SCRIPT_SECRET: "secret"
        }),
        true
    );
});

test("Apps Script posts the rendered message to the webhook", async () => {
    const originalFetch = global.fetch;
    let call = null;

    global.fetch = async (url, options) => {
        call = { url, options };

        return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ ok: true, messageId: "abc123" })
        };
    };

    try {
        const transport = appsScriptTransport({
            APPS_SCRIPT_URL: "https://script.google.com/macros/s/test/exec",
            APPS_SCRIPT_SECRET: "secret"
        });
        const result = await transport.send({
            to: "ada@example.com",
            subject: "Verify your QuickFix account",
            text: "Code 123456",
            html: "<p>Code 123456</p>"
        });

        assert.equal(result.captured, false);
        assert.equal(result.messageId, "abc123");
        assert.equal(call.url, "https://script.google.com/macros/s/test/exec");
        assert.equal(call.options.method, "POST");
        assert.equal(
            call.options.headers["Content-Type"],
            "application/json"
        );

        const body = JSON.parse(call.options.body);

        assert.equal(body.secret, "secret");
        assert.equal(body.to, "ada@example.com");
        assert.equal(body.subject, "Verify your QuickFix account");
        assert.equal(body.text, "Code 123456");
        assert.equal(body.html, "<p>Code 123456</p>");
    } finally {
        global.fetch = originalFetch;
    }
});

test("Apps Script rethrows a rejected send with the webhook error", async () => {
    const originalFetch = global.fetch;

    global.fetch = async () => ({
        ok: false,
        status: 200,
        text: async () => JSON.stringify({ ok: false, error: "bad secret" })
    });

    try {
        const transport = appsScriptTransport({
            APPS_SCRIPT_URL: "https://script.google.com/macros/s/test/exec",
            APPS_SCRIPT_SECRET: "secret"
        });

        await assert.rejects(
            transport.send({
                to: "ada@example.com",
                subject: "Verify",
                text: "Code",
                html: "<p>Code</p>"
            }),
            /Apps Script send failed.*bad secret/
        );
    } finally {
        global.fetch = originalFetch;
    }
});
