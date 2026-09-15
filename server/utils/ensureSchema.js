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
