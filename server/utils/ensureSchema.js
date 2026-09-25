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


async function ensureSchema() {
    const connection = await db.getConnection();

    try {
        if (!(await columnExists(connection, "notifications", "link"))) {
            await connection.query(
                `ALTER TABLE notifications
                 ADD COLUMN link VARCHAR(255) NULL AFTER type`
            );
        }

        // Email PIN (registration) + login 2FA OTP columns.
        // Shipped hashed, never plaintext. Each ALTER is only run when the
        // column is missing so existing databases migrate in place.
        const otpColumns = [
            ["two_factor_enabled", "BOOLEAN NOT NULL DEFAULT TRUE"],
            ["verification_code_hash", "VARCHAR(64) NULL"],
            ["verification_code_expires", "DATETIME NULL"],
            ["verification_attempts", "INT NOT NULL DEFAULT 0"],
            ["login_otp_hash", "VARCHAR(64) NULL"],
            ["login_otp_expires", "DATETIME NULL"],
            ["login_otp_attempts", "INT NOT NULL DEFAULT 0"]
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

        if (!(await tableExists(connection, "email_verification_tokens"))) {
            await connection.query(
                `CREATE TABLE email_verification_tokens (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    token_hash VARCHAR(64) NOT NULL UNIQUE,
                    expires_at DATETIME NOT NULL,
                    used BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_email_verification_user
                        FOREIGN KEY (user_id)
                        REFERENCES users(id)
                        ON DELETE CASCADE
                )`
            );
        }
    } finally {
        connection.release();
    }
}


module.exports = ensureSchema;
