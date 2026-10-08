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
    } finally {
        connection.release();
    }
}


module.exports = ensureSchema;
