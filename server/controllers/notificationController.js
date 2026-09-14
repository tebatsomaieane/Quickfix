const db = require("../config/db");


// GET /api/notifications/my  (authenticated)
const listMine = async (req, res) => {
    try {
        const [notifications] = await db.query(
            `SELECT id, title, message, type, is_read, created_at
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 100`,
            [req.user.id]
        );

        const [[{ unread }]] = await db.query(
            `SELECT COUNT(*) AS unread
             FROM notifications
             WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );

        return res.json({
            success: true,
            data: { notifications, unread }
        });
    } catch (error) {
        console.error("Error listing notifications:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to list notifications"
        });
    }
};


// PATCH /api/notifications/:id/read  (authenticated)
// Mark a single notification as read.
const markOneRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification id"
            });
        }

        const [result] = await db.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.json({
            success: true,
            message: "Notification marked as read"
        });
    } catch (error) {
        console.error("Error marking notification read:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark notification as read"
        });
    }
};


// POST /api/notifications/read  (authenticated)
// Mark all of the user's notifications as read.
const markAllRead = async (req, res) => {
    try {
        await db.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );

        return res.json({
            success: true,
            message: "Notifications marked as read"
        });
    } catch (error) {
        console.error("Error marking notifications read:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read"
        });
    }
};


// DELETE /api/notifications/:id  (authenticated)
// Delete a single notification.
const remove = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification id"
            });
        }

        const [result] = await db.query(
            `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.json({
            success: true,
            message: "Notification deleted"
        });
    } catch (error) {
        console.error("Error deleting notification:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete notification"
        });
    }
};


module.exports = {
    listMine,
    markOneRead,
    markAllRead,
    remove
};