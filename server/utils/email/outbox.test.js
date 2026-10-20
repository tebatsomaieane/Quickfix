const test = require("node:test");
const assert = require("node:assert/strict");

const {
    processOutbox,
    backoffSeconds,
    createMemoryStore,
    BACKOFF_SECONDS
} = require("./outbox");

const okTransport = (captured = true) => ({
    calls: [],
    async send(message) {
        this.calls.push(message);
        return { captured, messageId: `msg-${this.calls.length}` };
    }
});

const failTransport = (message) => ({
    async send() {
        throw new Error(message || "SMTP connection refused");
    }
});

test("a captured send is marked SENT and its body retained", async () => {
    const store = createMemoryStore();
    const transport = okTransport(true);

    await store.enqueue({
        to: "ada@example.com",
        toName: "Ada",
        template: "login_otp",
        payload: { firstName: "Ada", code: "123456" }
    });

    const summary = await processOutbox({ store, transport });
    const row = store.rows.get(1);

    assert.deepEqual(summary, { claimed: 1, sent: 1, retried: 0, failed: 0 });
    assert.equal(row.status, "SENT");
    assert.equal(row.sent_at instanceof Date, true);
    // The secret is gone from storage once the message is terminal.
    assert.equal(row.payload, null);
    assert.match(row.body_text, /123456/);
    assert.match(row.body_html, /123456/);
});

test("a real (non-capture) send does not persist the body", async () => {
    const store = createMemoryStore();
    const transport = okTransport(false);

    await store.enqueue({
        to: "ada@example.com",
        template: "password_reset",
        payload: { resetUrl: "https://app/reset?token=secret" }
    });

    await processOutbox({ store, transport });
    const row = store.rows.get(1);

    assert.equal(row.status, "SENT");
    assert.equal(row.body_text, null);
    assert.equal(row.body_html, null);
    assert.equal(row.payload, null);
});

test("a first failure is retried on the base backoff, not dropped", async () => {
    const store = createMemoryStore();
    const transport = failTransport();

    await store.enqueue({
        to: "ada@example.com",
        template: "login_otp",
        payload: { firstName: "Ada", code: "123456" }
    });

    const now = new Date("2026-01-01T00:00:00.000Z");
    const summary = await processOutbox({
        store,
        transport,
        now: () => now
    });
    const row = store.rows.get(1);

    assert.deepEqual(summary, { claimed: 1, sent: 0, retried: 1, failed: 0 });
    assert.equal(row.status, "PENDING");
    assert.equal(row.attempts, 1);
    assert.match(row.last_error, /SMTP/);
    assert.equal(
        row.next_attempt_at.getTime(),
        now.getTime() + BACKOFF_SECONDS[0] * 1000
    );
});

test("backoff grows with each attempt and caps at the last interval", () => {
    assert.equal(backoffSeconds(1), 60);
    assert.equal(backoffSeconds(2), 300);
    assert.equal(backoffSeconds(3), 900);
    assert.equal(backoffSeconds(4), 3600);
    assert.equal(backoffSeconds(5), 21600);
    assert.equal(backoffSeconds(99), 21600);
});

test("the final allowed attempt marks the message FAILED and clears the secret", async () => {
    const store = createMemoryStore([
        {
            to_email: "ada@example.com",
            template: "login_otp",
            payload: { code: "123456" },
            attempts: 4,
            max_attempts: 5
        }
    ]);

    const summary = await processOutbox({ store, transport: failTransport() });
    const row = store.rows.get(1);

    assert.deepEqual(summary, { claimed: 1, sent: 0, retried: 0, failed: 1 });
    assert.equal(row.status, "FAILED");
    assert.equal(row.attempts, 5);
    assert.equal(row.payload, null);
});

test("a claimed row cannot be claimed again by a second pass", async () => {
    const store = createMemoryStore();
    const transport = okTransport(true);

    await store.enqueue({
        to: "ada@example.com",
        template: "login_otp",
        payload: { firstName: "Ada", code: "123456" }
    });

    const first = await store.claimDue();

    assert.equal(first.length, 1);
    // Nothing is PENDING until the first pass resolves it.
    assert.equal((await store.claimDue()).length, 0);
    await processOutbox({ store, transport });
});

test("an unknown template fails through the retry path with a clear error", async () => {
    const store = createMemoryStore();
    const transport = okTransport(true);

    await store.enqueue({
        to: "ada@example.com",
        template: "not_a_template",
        payload: {}
    });

    const summary = await processOutbox({ store, transport });
    const row = store.rows.get(1);

    assert.equal(summary.retried, 1);
    assert.match(row.last_error, /Unknown email template/);
});

test("the recipient and rendered subject reach the transport", async () => {
    const store = createMemoryStore();
    const transport = okTransport(true);

    await store.enqueue({
        to: "ada@example.com",
        toName: "Ada",
        template: "verify_email",
        payload: { firstName: "Ada", code: "654321" }
    });

    await processOutbox({ store, transport });

    assert.equal(transport.calls.length, 1);
    assert.equal(transport.calls[0].to, "ada@example.com");
    assert.equal(transport.calls[0].subject, "Verify your QuickFix account");
});
