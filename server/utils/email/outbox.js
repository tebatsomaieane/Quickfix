// Durable transactional-email outbox.
//
// A request never talks to SMTP directly: it writes a PENDING row here and a
// background worker drains the queue. That gives three real-world properties
// the old inline send did not have:
//
//   - a slow or down mail server cannot hold up an HTTP response;
//   - a transient failure is retried on a backoff instead of being lost;
//   - every send is auditable, with attempt count and last error.
//
// The store and transport are injected, so the whole state machine is tested
// without a database or network (see outbox.test.js).

const db = require("../../config/db");
const { renderTemplate } = require("./templates");
const { getTransport } = require("./transport");

// Backoff between attempts, in seconds, indexed by the attempt that just
// failed. Caps at the last entry for any further retries.
const BACKOFF_SECONDS = [60, 300, 900, 3600, 21600];

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BATCH_SIZE = 20;
const MAX_ERROR_LENGTH = 500;

const backoffSeconds = (attempt) => {
    const index = Math.min(
        Math.max(attempt, 1) - 1,
        BACKOFF_SECONDS.length - 1
    );

    return BACKOFF_SECONDS[index];
};

// mysql2 returns JSON columns already parsed, but a driver/version change or a
// value written by another tool can hand back a string. Normalise both.
const normalizePayload = (payload) => {
    if (!payload) {
        return {};
    }

    if (typeof payload === "string") {
        try {
            return JSON.parse(payload);
        } catch {
            return {};
        }
    }

    return payload;
};

const truncate = (value) =>
    String(value || "Unknown error").slice(0, MAX_ERROR_LENGTH);

const createDbStore = (pool = db) => ({
    async enqueue({
        to,
        toName = null,
        template,
        payload = {},
        maxAttempts = DEFAULT_MAX_ATTEMPTS
    }) {
        const [result] = await pool.query(
            `INSERT INTO email_outbox
                (to_email, to_name, template, payload, status,
                 attempts, max_attempts, next_attempt_at)
             VALUES (?, ?, ?, ?, 'PENDING', 0, ?, NOW())`,
            [to, toName, template, JSON.stringify(payload), maxAttempts]
        );

        return result.insertId;
    },

    // Returns the rows this worker managed to claim. Claiming is a conditional
    // UPDATE, so two workers racing for the same row cannot both win it and
    // send twice. `attempts` in the result is the value after the increment.
    async claimDue(limit = DEFAULT_BATCH_SIZE) {
        const [rows] = await pool.query(
            `SELECT id, to_email, to_name, template, payload, attempts,
                    max_attempts
             FROM email_outbox
             WHERE status = 'PENDING' AND next_attempt_at <= NOW()
             ORDER BY id ASC
             LIMIT ?`,
            [limit]
        );

        const claimed = [];

        for (const row of rows) {
            const [result] = await pool.query(
                `UPDATE email_outbox
                 SET status = 'SENDING', attempts = attempts + 1,
                     updated_at = NOW()
                 WHERE id = ? AND status = 'PENDING'`,
                [row.id]
            );

            if (result.affectedRows === 1) {
                claimed.push({
                    ...row,
                    attempts: row.attempts + 1,
                    payload: normalizePayload(row.payload)
                });
            }
        }

        return claimed;
    },

    async markSent(id, { messageId, bodyText = null, bodyHtml = null } = {}) {
        await pool.query(
            `UPDATE email_outbox
             SET status = 'SENT', sent_at = NOW(), payload = NULL,
                 last_error = NULL, provider_message_id = ?,
                 body_text = ?, body_html = ?, updated_at = NOW()
             WHERE id = ?`,
            [messageId || null, bodyText, bodyHtml, id]
        );
    },

    async markRetry(id, { nextAttemptAt, error }) {
        await pool.query(
            `UPDATE email_outbox
             SET status = 'PENDING', next_attempt_at = ?, last_error = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [nextAttemptAt, truncate(error), id]
        );
    },

    async markFailed(id, { error }) {
        await pool.query(
            `UPDATE email_outbox
             SET status = 'FAILED', payload = NULL, last_error = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [truncate(error), id]
        );
    }
});

const dbStore = createDbStore(db);

// In-memory store for tests. Not used in the running server.
const createMemoryStore = (seed = []) => {
    let autoId = 1;
    const rows = new Map();

    for (const row of seed) {
        rows.set(autoId, {
            id: autoId,
            status: "PENDING",
            attempts: 0,
            max_attempts: DEFAULT_MAX_ATTEMPTS,
            next_attempt_at: new Date(0),
            last_error: null,
            ...row
        });
        autoId += 1;
    }

    return {
        rows,
        async enqueue({
            to,
            toName = null,
            template,
            payload = {},
            maxAttempts = DEFAULT_MAX_ATTEMPTS
        }) {
            const id = autoId;
            autoId += 1;

            rows.set(id, {
                id,
                to_email: to,
                to_name: toName,
                template,
                payload,
                status: "PENDING",
                attempts: 0,
                max_attempts: maxAttempts,
                next_attempt_at: new Date(0),
                last_error: null
            });

            return id;
        },
        async claimDue(limit = DEFAULT_BATCH_SIZE) {
            const claimed = [];

            for (const row of rows.values()) {
                if (claimed.length >= limit) {
                    break;
                }

                if (row.status !== "PENDING" || row.next_attempt_at > new Date()) {
                    continue;
                }

                row.status = "SENDING";
                row.attempts += 1;
                claimed.push({ ...row });
            }

            return claimed;
        },
        async markSent(id, { messageId, bodyText = null, bodyHtml = null } = {}) {
            const row = rows.get(id);
            row.status = "SENT";
            row.payload = null;
            row.last_error = null;
            row.provider_message_id = messageId;
            row.body_text = bodyText;
            row.body_html = bodyHtml;
            row.sent_at = new Date();
        },
        async markRetry(id, { nextAttemptAt, error }) {
            const row = rows.get(id);
            row.status = "PENDING";
            row.next_attempt_at = nextAttemptAt;
            row.last_error = truncate(error);
        },
        async markFailed(id, { error }) {
            const row = rows.get(id);
            row.status = "FAILED";
            row.payload = null;
            row.last_error = truncate(error);
        }
    };
};

// Drain every due row once. `now` is injectable so the backoff schedule can be
// asserted deterministically.
const processOutbox = async ({
    store = dbStore,
    transport = getTransport(),
    limit = DEFAULT_BATCH_SIZE,
    now = () => new Date()
} = {}) => {
    const claimed = await store.claimDue(limit);
    const summary = { claimed: claimed.length, sent: 0, retried: 0, failed: 0 };

    for (const message of claimed) {
        try {
            const rendered = renderTemplate(message.template, message.payload);
            const result = await transport.send({
                to: message.to_email,
                toName: message.to_name,
                subject: rendered.subject,
                text: rendered.text,
                html: rendered.html
            });

            await store.markSent(message.id, {
                messageId: result?.messageId,
                // Only the dev capture transport returns bodies; a real send
                // leaves them NULL so message contents are not persisted.
                bodyText: result?.captured ? rendered.text : null,
                bodyHtml: result?.captured ? rendered.html : null
            });
            summary.sent += 1;
        } catch (error) {
            const maxAttempts = message.max_attempts || DEFAULT_MAX_ATTEMPTS;

            if (message.attempts >= maxAttempts) {
                await store.markFailed(message.id, { error: error.message });
                summary.failed += 1;
            } else {
                const nextAttemptAt = new Date(
                    now().getTime() + backoffSeconds(message.attempts) * 1000
                );

                await store.markRetry(message.id, {
                    nextAttemptAt,
                    error: error.message
                });
                summary.retried += 1;
            }
        }
    }

    return summary;
};

const enqueue = (options, store = dbStore) => store.enqueue(options);

module.exports = {
    enqueue,
    processOutbox,
    backoffSeconds,
    createDbStore,
    createMemoryStore,
    dbStore,
    BACKOFF_SECONDS,
    DEFAULT_MAX_ATTEMPTS,
    DEFAULT_BATCH_SIZE
};
