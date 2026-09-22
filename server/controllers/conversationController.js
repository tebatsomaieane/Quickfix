const db = require("../config/db");
const {
    getProviderId,
    getCustomerId
} = require("../utils/helpers");
const { pushConversation } = require("../utils/realtime");


const CONVERSATION_LIST_JOIN = `
    SELECT v.id, v.customer_id, v.provider_id, v.request_id,
           v.created_at,
           r.title AS request_title,
           cus.first_name AS customer_first_name,
           cus.last_name AS customer_last_name,
           prov.first_name AS provider_first_name,
           prov.last_name AS provider_last_name,
           vs.last_message,
           vs.last_message_at,
           (SELECT COUNT(*)
            FROM messages um
            WHERE um.conversation_id = v.id
              AND um.is_read = FALSE
              AND um.sender_id <> ?) AS unread_count
    FROM conversations v
    JOIN customer_profiles cp ON cp.id = v.customer_id
    JOIN users cus ON cus.id = cp.user_id
    JOIN provider_profiles pp ON pp.id = v.provider_id
    JOIN users prov ON prov.id = pp.user_id
    LEFT JOIN service_requests r ON r.id = v.request_id
    LEFT JOIN (
        SELECT m1.conversation_id,
               m1.message AS last_message,
               m1.created_at AS last_message_at
        FROM messages m1
        JOIN (
            SELECT conversation_id, MAX(id) AS max_id
            FROM messages
            GROUP BY conversation_id
        ) m2 ON m2.conversation_id = m1.conversation_id
            AND m2.max_id = m1.id
    ) vs ON vs.conversation_id = v.id
`;


const resolveRoles = async (userId) => {
    const customerId = await getCustomerId(userId);
    const providerId = await getProviderId(userId);

    return { customerId, providerId };
};


const ensureParticipant = async (req, res, conversationId) => {
    const [conversations] = await db.query(
        `SELECT id, customer_id, provider_id
         FROM conversations WHERE id = ?`,
        [conversationId]
    );

    if (conversations.length === 0) {
        return { error: { status: 404, message: "Conversation not found" } };
    }

    const conversation = conversations[0];
    const { customerId, providerId } = await resolveRoles(req.user.id);

    if (customerId !== conversation.customer_id &&
        providerId !== conversation.provider_id) {
        return { error: { status: 403, message: "Access denied" } };
    }

    return { conversation };
};


// GET /api/conversations/my  (CUSTOMER or PROVIDER)
const listMine = async (req, res) => {
    try {
        const { customerId, providerId } = await resolveRoles(req.user.id);

        if (!customerId && !providerId) {
            return res.status(403).json({
                success: false,
                message: "No customer or provider profile associated"
            });
        }

        const [conversations] = await db.query(
            `${CONVERSATION_LIST_JOIN}
             WHERE (? IS NULL OR v.customer_id = ?)
                AND (? IS NULL OR v.provider_id = ?)
             ORDER BY COALESCE(vs.last_message_at, v.created_at) DESC`,
            [req.user.id, customerId, customerId, providerId, providerId]
        );

        const totalUnread = conversations.reduce(
            (sum, conversation) => sum + (conversation.unread_count || 0),
            0
        );

        return res.json({
            success: true,
            data: { conversations, totalUnread }
        });
    } catch (error) {
        console.error("Error listing conversations:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to list conversations"
        });
    }
};


// POST /api/conversations  { request_id }  (CUSTOMER or PROVIDER of the request)
// Find existing conversation for the request or create one.
const createOrFind = async (req, res) => {
    try {
        const { request_id } = req.body;

        if (!request_id) {
            return res.status(400).json({
                success: false,
                message: "Request id is required"
            });
        }

        const { customerId, providerId } = await resolveRoles(req.user.id);

        if (!customerId && !providerId) {
            return res.status(403).json({
                success: false,
                message: "No customer or provider profile associated"
            });
        }

        // The requester must be a participant on the request or have offered on it.
        const [requests] = await db.query(
            `SELECT id, customer_id FROM service_requests WHERE id = ?`,
            [request_id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        const isOwner = requests[0].customer_id === customerId;

        // Participants: the customer and the assigned provider
        const [jobs] = await db.query(
            `SELECT provider_id FROM jobs
             WHERE request_id = ? AND status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')
             LIMIT 1`,
            [request_id]
        );

        if (!isOwner) {
            // Only the assigned provider may message on the request -
            // a provider whose offer was rejected or withdrawn must not
            // gain access to the customer's conversation.
            if (jobs.length === 0 || jobs[0].provider_id !== providerId) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a participant in this request"
                });
            }
        } else if (jobs.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No provider selected yet for this request"
            });
        }

        const targetProviderId = jobs[0].provider_id;

        // Find or create
        const [existing] = await db.query(
            `SELECT id FROM conversations
             WHERE request_id = ? AND customer_id = ? AND provider_id = ?`,
            [request_id, requests[0].customer_id, targetProviderId]
        );

        let conversationId;

        if (existing.length > 0) {
            conversationId = existing[0].id;
        } else {
            const [result] = await db.query(
                `INSERT INTO conversations (customer_id, provider_id, request_id)
                 VALUES (?, ?, ?)`,
                [requests[0].customer_id, targetProviderId, request_id]
            );

            conversationId = result.insertId;
        }

        const [conversations] = await db.query(
            `SELECT v.id, v.customer_id, v.provider_id, v.request_id,
                    v.created_at,
                    cus.first_name AS customer_first_name,
                    cus.last_name AS customer_last_name,
                    prov.first_name AS provider_first_name,
                    prov.last_name AS provider_last_name
             FROM conversations v
             JOIN customer_profiles cp ON cp.id = v.customer_id
             JOIN users cus ON cus.id = cp.user_id
             JOIN provider_profiles pp ON pp.id = v.provider_id
             JOIN users prov ON prov.id = pp.user_id
             WHERE v.id = ?`,
            [conversationId]
        );

        return res.status(201).json({
            success: true,
            data: conversations[0]
        });
    } catch (error) {
        console.error("Error creating conversation:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create conversation"
        });
    }
};


// GET /api/conversations/:id  (participant)
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation id"
            });
        }

        const { error } = await ensureParticipant(req, res, id);

        if (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        const [conversations] = await db.query(
            `${CONVERSATION_LIST_JOIN}
             WHERE v.id = ?`,
            [req.user.id, id]
        );

        const [messages] = await db.query(
            `SELECT id, sender_id, message, is_read, created_at
             FROM messages
             WHERE conversation_id = ?
             ORDER BY created_at ASC`,
            [id]
        );

        return res.json({
            success: true,
            data: {
                ...conversations[0],
                messages
            }
        });
    } catch (error) {
        console.error("Error fetching conversation:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch conversation"
        });
    }
};


// POST /api/conversations/:id/messages  { message }  (participant)
const sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation id"
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty"
            });
        }

        if (message.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Message must be 5000 characters or fewer"
            });
        }

        const { error } = await ensureParticipant(req, res, id);

        if (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        const [result] = await db.query(
            `INSERT INTO messages (conversation_id, sender_id, message, is_read)
             VALUES (?, ?, ?, FALSE)`,
            [id, req.user.id, message.trim()]
        );

        const [messages] = await db.query(
            `SELECT id, sender_id, message, is_read, created_at
             FROM messages WHERE id = ?`,
            [result.insertId]
        );

        // Real-time hint for both participants so their open thread/list
        // refreshes instantly instead of waiting for the next poll.
        const [participants] = await db.query(
            `SELECT cu.id AS customer_user_id, pu.id AS provider_user_id
             FROM conversations v
             JOIN customer_profiles cp ON cp.id = v.customer_id
             JOIN users cu ON cu.id = cp.user_id
             JOIN provider_profiles pp ON pp.id = v.provider_id
             JOIN users pu ON pu.id = pp.user_id
             WHERE v.id = ?`,
            [id]
        );

        if (participants.length > 0) {
            const { customer_user_id, provider_user_id } = participants[0];

            pushConversation(customer_user_id, id, messages[0]);
            pushConversation(provider_user_id, id, messages[0]);
        }

        return res.status(201).json({
            success: true,
            data: messages[0]
        });
    } catch (error) {
        console.error("Error sending message:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }
};


// POST /api/conversations/:id/read  (participant)
// Mark messages from the other participant as read.
const markRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation id"
            });
        }

        const { error } = await ensureParticipant(req, res, id);

        if (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        await db.query(
            `UPDATE messages
             SET is_read = TRUE
             WHERE conversation_id = ? AND sender_id <> ? AND is_read = FALSE`,
            [id, req.user.id]
        );

        return res.json({
            success: true,
            message: "Conversation marked as read"
        });
    } catch (error) {
        console.error("Error marking conversation read:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark conversation as read"
        });
    }
};


module.exports = {
    listMine,
    createOrFind,
    getById,
    sendMessage,
    markRead
};