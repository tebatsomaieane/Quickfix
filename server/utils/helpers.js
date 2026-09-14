const db = require("../config/db");


// Insert a notification for a user.
// When an active transaction connection is provided, the write uses it so the
// notification commits/rolls back with the surrounding transaction.
const createNotification = async (userId, title, message, type, connection) => {
    const target = connection || db;

    await target.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, ?)`,
        [userId, title, message, type]
    );
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
    getCustomerId
};