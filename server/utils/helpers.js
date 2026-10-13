const db = require("../config/db");
const { pushToUser } = require("./realtime");


// Read a numeric environment variable.
// Unlike `Number(process.env.X) || fallback`, a value of 0 is honoured rather
// than replaced by the default, so settings where 0 means "disable" (the
// scheduler and upload-cleanup intervals) actually take effect. An unset,
// blank, or non-numeric value falls back instead of producing NaN.
const envNumber = (name, fallback) => {
    const raw = process.env[name];

    if (raw === undefined || raw === "") {
        return fallback;
    }

    const value = Number(raw);

    return Number.isFinite(value) ? value : fallback;
};


// Insert a notification for a user.
// When an active transaction connection is provided, the write uses it so the
// notification commits/rolls back with the surrounding transaction.
const createNotification = async (
    userId,
    title,
    message,
    type,
    connection,
    link
) => {
    const target = connection || db;

    await target.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, title, message, type, link || null]
    );

    // Real-time hint: tell any open stream for this user that something new
    // arrived. Best-effort - the client refetches on receipt.
    pushToUser(userId, "notification", { title, type });
};


// Resolve the provider profile id for a user id (or null)
const getProviderId = async (userId, connection) => {
    const target = connection || db;

    const [rows] = await target.query(
        "SELECT id FROM provider_profiles WHERE user_id = ?",
        [userId]
    );

    return rows.length ? rows[0].id : null;
};


// Resolve the customer profile id for a user id (or null)
const getCustomerId = async (userId, connection) => {
    const target = connection || db;

    const [rows] = await target.query(
        "SELECT id FROM customer_profiles WHERE user_id = ?",
        [userId]
    );

    return rows.length ? rows[0].id : null;
};


module.exports = {
    createNotification,
    getProviderId,
    getCustomerId,
    envNumber
};