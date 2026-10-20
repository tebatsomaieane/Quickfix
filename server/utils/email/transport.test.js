const test = require("node:test");
const assert = require("node:assert/strict");

const {
    resolveMode,
    canDeliver,
    smtpConfigured,
    captureTransport
} = require("./transport");

const smtpEnv = {
    SMTP_HOST: "smtp.example.com",
    SMTP_USER: "user",
    SMTP_PASSWORD: "secret",
    SMTP_PORT: "587"
};

test("auto resolves to capture in development without SMTP", () => {
    const env = { NODE_ENV: "development" };

    assert.equal(resolveMode(env), "capture");
    assert.equal(canDeliver(env), true);
});

test("auto resolves to smtp in production without SMTP, and cannot deliver", () => {
    const env = { NODE_ENV: "production" };

    assert.equal(resolveMode(env), "smtp");
    assert.equal(canDeliver(env), false);
});

test("auto uses smtp whenever credentials are present", () => {
    const env = { NODE_ENV: "development", ...smtpEnv };

    assert.equal(resolveMode(env), "smtp");
    assert.equal(canDeliver(env), true);
    assert.equal(smtpConfigured(env), true);
});

test("smtp is not considered configured without user or password", () => {
    assert.equal(
        smtpConfigured({ SMTP_HOST: "smtp.example.com" }),
        false
    );
    assert.equal(
        smtpConfigured({ SMTP_HOST: "", SMTP_USER: "u", SMTP_PASSWORD: "p" }),
        false
    );
});

test("capture is refused in production even when forced", () => {
    const env = { NODE_ENV: "production", EMAIL_TRANSPORT: "capture" };

    assert.equal(resolveMode(env), "capture");
    assert.equal(canDeliver(env), false);
});

test("smtp forced without credentials cannot deliver", () => {
    const env = { NODE_ENV: "development", EMAIL_TRANSPORT: "smtp" };

    assert.equal(resolveMode(env), "smtp");
    assert.equal(canDeliver(env), false);
});

test("the capture transport reports itself and returns an id", async () => {
    const result = await captureTransport.send({
        to: "a@b.co",
        subject: "s",
        text: "t",
        html: "<p>t</p>"
    });

    assert.equal(result.captured, true);
    assert.match(result.messageId, /^capture-/);
});
