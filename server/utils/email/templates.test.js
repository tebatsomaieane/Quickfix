const test = require("node:test");
const assert = require("node:assert/strict");

const {
    renderTemplate,
    escapeHtml,
    TEMPLATE_NAMES
} = require("./templates");

test("login_otp renders subject, text and html with the code", () => {
    const rendered = renderTemplate("login_otp", {
        firstName: "Ada",
        code: "123456"
    });

    assert.equal(rendered.subject, "Your QuickFix login code");
    assert.match(rendered.text, /Hi Ada,/);
    assert.match(rendered.text, /123456/);
    assert.match(rendered.html, /123456/);
});

test("verify_email uses its own subject and copy", () => {
    const rendered = renderTemplate("verify_email", {
        firstName: "Ada",
        code: "000111"
    });

    assert.equal(rendered.subject, "Verify your QuickFix account");
    assert.match(rendered.text, /000111/);
    assert.match(rendered.html, /Verify your email address/);
});

test("password_reset embeds the reset url in both parts", () => {
    const url = "https://app.quickfix.test/reset-password?token=abc123";
    const rendered = renderTemplate("password_reset", { resetUrl: url });

    assert.equal(rendered.subject, "Reset your QuickFix password");
    assert.match(rendered.text, /abc123/);
    assert.match(rendered.html, /Reset password/);
    assert.match(rendered.html, /abc123/);
});

test("welcome greets the user by name", () => {
    const rendered = renderTemplate("welcome", { firstName: "Ada" });

    assert.match(rendered.subject, /Welcome/);
    assert.match(rendered.html, /Ada/);
});

test("raw passes finished parts straight through", () => {
    const rendered = renderTemplate("raw", {
        subject: "Hi",
        text: "plain",
        html: "<p>rich</p>"
    });

    assert.deepEqual(rendered, {
        subject: "Hi",
        text: "plain",
        html: "<p>rich</p>"
    });
});

test("raw falls back to text when html is omitted", () => {
    const rendered = renderTemplate("raw", { subject: "Hi", text: "plain" });

    assert.equal(rendered.html, "plain");
});

test("an unknown template throws instead of sending a blank email", () => {
    assert.throws(
        () => renderTemplate("does_not_exist", {}),
        /Unknown email template/
    );
});

test("user-supplied names are html-escaped", () => {
    const rendered = renderTemplate("login_otp", {
        firstName: "<script>alert(1)</script>",
        code: "123456"
    });

    assert.doesNotMatch(rendered.html, /<script>/);
    assert.match(rendered.html, /&lt;script&gt;/);
});

test("escapeHtml covers the five dangerous characters", () => {
    assert.equal(
        escapeHtml('&<>"\''),
        "&amp;&lt;&gt;&quot;&#39;"
    );
});

test("the template catalogue is stable", () => {
    assert.deepEqual(
        [...TEMPLATE_NAMES].sort(),
        ["login_otp", "password_reset", "raw", "verify_email", "welcome"]
    );
});
