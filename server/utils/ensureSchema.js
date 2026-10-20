const db = require("../config/db");


async function columnExists(connection, table, column) {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS n
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?`,
        [table, column]
    );

    return Number(rows[0].n) > 0;
}


async function tableExists(connection, table) {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS n
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?`,
        [table]
    );

    return Number(rows[0].n) > 0;
}


async function indexExists(connection, table, indexName) {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS n
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND INDEX_NAME = ?`,
        [table, indexName]
    );

    return Number(rows[0].n) > 0;
}


// Indexes for hot read paths. These mirror database/schema.sql and are created
// here so an already-running database picks them up without a manual migration.
// Table, index and column names are fixed constants, so the interpolation below
// cannot carry user input.
const REQUIRED_INDEXES = [
    ["provider_profiles", "idx_provider_verification", "(verification_status)"],
    ["offers", "idx_offers_valid_until", "(valid_until)"],
    ["service_requests", "idx_requests_preferred_date", "(preferred_date)"],
    ["users", "idx_users_created", "(created_at)"],
    [
        "messages",
        "idx_messages_conversation_read_sender",
        "(conversation_id, is_read, sender_id)"
    ]
];


async function ensureSchema() {
    const connection = await db.getConnection();

    try {
        if (!(await columnExists(connection, "notifications", "link"))) {
            await connection.query(
                `ALTER TABLE notifications
                 ADD COLUMN link VARCHAR(255) NULL AFTER type`
            );
        }

        // Login 2FA OTP columns. Shipped hashed, never plaintext. Each ALTER
        // is only run when the column is missing so existing databases
        // migrate in place. Two-factor login is opt-in, so the column
        // defaults to FALSE for accounts created without it being set.
        const otpColumns = [
            ["two_factor_enabled", "BOOLEAN NOT NULL DEFAULT FALSE"],
            ["login_otp_hash", "VARCHAR(64) NULL"],
            ["login_otp_expires", "DATETIME NULL"],
            ["login_otp_attempts", "INT NOT NULL DEFAULT 0"],
            ["email_verify_otp_hash", "VARCHAR(64) NULL"],
            ["email_verify_otp_expires", "DATETIME NULL"],
            ["email_verify_otp_attempts", "INT NOT NULL DEFAULT 0"]
        ];

        for (const [column, definition] of otpColumns) {
            if (!(await columnExists(connection, "users", column))) {
                await connection.query(
                    `ALTER TABLE users ADD COLUMN ${column} ${definition}`
                );
            }
        }

        if (!(await columnExists(connection, "service_requests", "preferred_provider_id"))) {
            await connection.query(
                `ALTER TABLE service_requests
                 ADD COLUMN preferred_provider_id INT NULL AFTER service_id`
            );
        }

        for (const [table, indexName, columns] of REQUIRED_INDEXES) {
            if (!(await indexExists(connection, table, indexName))) {
                await connection.query(
                    `CREATE INDEX ${indexName} ON ${table} ${columns}`
                );
            }
        }

        // Transactional email outbox. Created here so an existing database
        // gains the queue (and its worker can start) without a manual
        // migration. Mirrors database/schema.sql.
        if (!(await tableExists(connection, "email_outbox"))) {
            await connection.query(
                `CREATE TABLE email_outbox (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    to_email VARCHAR(255) NOT NULL,
                    to_name VARCHAR(150),
                    template VARCHAR(64) NOT NULL,
                    payload JSON,
                    status ENUM('PENDING', 'SENDING', 'SENT', 'FAILED')
                        NOT NULL DEFAULT 'PENDING',
                    attempts INT NOT NULL DEFAULT 0,
                    max_attempts INT NOT NULL DEFAULT 5,
                    last_error VARCHAR(500),
                    provider_message_id VARCHAR(255),
                    body_text MEDIUMTEXT,
                    body_html MEDIUMTEXT,
                    next_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    sent_at DATETIME,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP
                )`
            );
        }

        const EMAIL_INDEXES = [
            ["email_outbox", "idx_email_outbox_due", "(status, next_attempt_at)"],
            ["email_outbox", "idx_email_outbox_recipient", "(to_email)"]
        ];

        for (const [table, indexName, columns] of EMAIL_INDEXES) {
            if (!(await indexExists(connection, table, indexName))) {
                await connection.query(
                    `CREATE INDEX ${indexName} ON ${table} ${columns}`
                );
            }
        }
    } finally {
        connection.release();
    }
}


module.exports = ensureSchema;
