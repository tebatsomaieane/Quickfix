const db = require("../config/db");
const { getProviderId } = require("../utils/helpers");


// GET /api/provider/requests  (PROVIDER - open requests they can offer on)
const listAvailable = async (req, res) => {
    try {
        const providerId = await getProviderId(req.user.id);

        if (!providerId) {
            return res.status(403).json({
                success: false,
                message: "No provider profile associated with this account"
            });
        }

        const [rows] = await db.query(
            `SELECT r.id, r.title, r.location,
                    r.budget_min, r.budget_max,
                    r.preferred_date, r.preferred_time,
                    r.status, r.created_at,
                    s.id AS service_id, s.name AS service_name,
                    c.name AS category_name,
                    EXISTS(
                        SELECT 1 FROM provider_services ps
                        WHERE ps.provider_id = ? AND ps.service_id = r.service_id
                    ) AS matches_skills,
                    EXISTS(
                        SELECT 1 FROM offers o
                        WHERE o.request_id = r.id
                          AND o.provider_id = ?
                          AND o.status = 'PENDING'
                    ) AS has_pending_offer
             FROM service_requests r
             JOIN services s ON s.id = r.service_id
             JOIN categories c ON c.id = s.category_id
             WHERE r.status IN ('OPEN', 'OFFERS_RECEIVED')
             ORDER BY r.created_at DESC
             LIMIT 200`,
            [providerId, providerId]
        );

        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error listing available requests:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load requests"
        });
    }
};


// GET /api/provider/requests/:id  (PROVIDER - request details + own offer)
const getById = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({
            success: false,
            message: "Invalid request id"
        });
    }

    try {
        const providerId = await getProviderId(req.user.id);

        if (!providerId) {
            return res.status(403).json({
                success: false,
                message: "No provider profile associated with this account"
            });
        }

        const [requests] = await db.query(
            `SELECT r.id, r.title, r.description, r.location,
                    r.preferred_date, r.preferred_time,
                    r.budget_min, r.budget_max,
                    r.status, r.created_at,
                    s.name AS service_name,
                    c.name AS category_name
             FROM service_requests r
             JOIN services s ON s.id = r.service_id
             JOIN categories c ON c.id = s.category_id
             WHERE r.id = ? AND r.status IN ('OPEN', 'OFFERS_RECEIVED')`,
            [id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found or no longer accepting offers"
            });
        }

        const request = requests[0];

        const [offers] = await db.query(
            `SELECT id, price, message, estimated_hours, valid_until,
                    status, created_at
             FROM offers
             WHERE request_id = ? AND provider_id = ?`,
            [id, providerId]
        );

        const [attachments] = await db.query(
            `SELECT id, file_name, file_url, file_type, created_at
             FROM request_attachments
             WHERE request_id = ?
             ORDER BY id ASC`,
            [id]
        );

        request.my_offer = offers[0] || null;
        request.attachments = attachments;

        return res.json({ success: true, data: request });
    } catch (error) {
        console.error("Error fetching available request:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load request"
        });
    }
};


module.exports = {
    listAvailable,
    getById
};