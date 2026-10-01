const db = require("../config/db");
const {
    createNotification,
    getCustomerId
} = require("../utils/helpers");


// POST /api/requests  (CUSTOMER)
const create = async (req, res) => {
    try {
        const {
            service_id,
            title,
            description,
            location,
            preferred_date,
            preferred_time,
            budget_min,
            budget_max
        } = req.body;

        // 1. Shape, lengths, the date, the clock time and the budget bounds are
        //    all settled by the `content.createRequest` schema, which runs
        //    before this handler -- so an invalid request never reaches a query.
        //    What is left is the one check no schema can make: that the chosen
        //    service is real and bookable.
        let bMin = budget_min;
        let bMax = budget_max;

        bMin = bMin === undefined || bMin === null || bMin === "" ? null : Number(bMin);
        bMax = bMax === undefined || bMax === null || bMax === "" ? null : Number(bMax);

        // 2. Verify the service exists and is active
        const [services] = await db.query(
            `SELECT id FROM services
             WHERE id = ? AND status = 'ACTIVE'`,
            [service_id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found or unavailable"
            });
        }

        // 3. Map user to customer profile
        const customerId = await getCustomerId(req.user.id);

        if (!customerId) {
            return res.status(403).json({
                success: false,
                message: "No customer profile associated with this account"
            });
        }

        // 4. Create the request (with optional photo/video attachments)
        const attachments = Array.isArray(req.body.attachments)
            ? req.body.attachments
            : [];

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO service_requests
                 (customer_id, service_id, title, description, location,
                  preferred_date, preferred_time, budget_min, budget_max, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
                [
                    customerId,
                    service_id,
                    title.trim(),
                    description.trim(),
                    location.trim(),
                    preferred_date || null,
                    preferred_time || null,
                    bMin,
                    bMax
                ]
            );

            for (const attachment of attachments) {
                const fileUrl = String(
                    attachment.url || attachment.file_url || ""
                ).trim();
                const fileName = String(
                    attachment.filename ||
                        attachment.file_name ||
                        `attachment-${result.insertId}`
                ).trim();

                if (!fileUrl || fileUrl.length > 500) {
                    await connection.rollback();

                    return res.status(400).json({
                        success: false,
                        message:
                            "Each attachment needs a valid file URL (max 500 characters)"
                    });
                }

                await connection.query(
                    `INSERT INTO request_attachments
                     (request_id, file_name, file_url, file_type)
                     VALUES (?, ?, ?, ?)`,
                    [
                        result.insertId,
                        fileName,
                        fileUrl,
                        attachment.mimeType || attachment.file_type || null
                    ]
                );
            }

            await connection.commit();

            return res.status(201).json({
                success: true,
                message: "Service request posted successfully",
                data: { id: result.insertId }
            });
        } catch (error) {
            await connection.rollback();

            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error creating request:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create service request"
        });
    }
};


// GET /api/requests  (CUSTOMER - own requests)
const listForCustomer = async (req, res) => {
    try {
        const customerId = await getCustomerId(req.user.id);

        if (!customerId) {
            return res.status(403).json({
                success: false,
                message: "No customer profile associated with this account"
            });
        }

        const [requests] = await db.query(
            `SELECT r.id, r.title, r.description, r.location,
                    r.preferred_date, r.preferred_time,
                    r.budget_min, r.budget_max, r.status, r.created_at,
                    s.name AS service_name,
                    c.name AS category_name,
                    (SELECT COUNT(*) FROM offers o
                     WHERE o.request_id = r.id
                       AND o.status IN ('PENDING', 'ACCEPTED'))
                        AS offers_count
             FROM service_requests r
             JOIN services s ON s.id = r.service_id
             JOIN categories c ON c.id = s.category_id
             WHERE r.customer_id = ?
             ORDER BY r.created_at DESC`,
            [customerId]
        );

        res.json({ success: true, data: requests });
    } catch (error) {
        console.error("Error fetching customer requests:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch requests"
        });
    }
};


// GET /api/requests/:id  (CUSTOMER - own request)
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid request id"
            });
        }

        const customerId = await getCustomerId(req.user.id);

        if (!customerId) {
            return res.status(403).json({
                success: false,
                message: "No customer profile associated with this account"
            });
        }

        const [requests] = await db.query(
            `SELECT r.id, r.title, r.description, r.location,
                    r.preferred_date, r.preferred_time,
                    r.budget_min, r.budget_max, r.status, r.created_at,
                    s.id AS service_id, s.name AS service_name,
                    c.id AS category_id, c.name AS category_name
             FROM service_requests r
             JOIN services s ON s.id = r.service_id
             JOIN categories c ON c.id = s.category_id
             WHERE r.id = ? AND r.customer_id = ?`,
            [id, customerId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        const request = requests[0];

        const [offers] = await db.query(
            `SELECT o.id, o.price, o.message, o.estimated_hours,
                    o.valid_until, o.status, o.created_at,
                    pp.id AS provider_id,
                    u.first_name, u.last_name, u.phone,
                    pp.location, pp.verification_status,
                    pp.profile_image, pp.experience_years
             FROM offers o
             JOIN provider_profiles pp ON pp.id = o.provider_id
             JOIN users u ON u.id = pp.user_id
             WHERE o.request_id = ?
             ORDER BY
               CASE o.status
                 WHEN 'ACCEPTED' THEN 0
                 WHEN 'PENDING' THEN 1
                 ELSE 2
               END,
               o.price ASC`,
            [id]
        );

        const [jobs] = await db.query(
            `SELECT id, status, started_at, completed_at
             FROM jobs
             WHERE request_id = ?`,
            [id]
        );

        const [attachments] = await db.query(
            `SELECT id, file_name, file_url, file_type, created_at
             FROM request_attachments
             WHERE request_id = ?
             ORDER BY id ASC`,
            [id]
        );

        request.offers = offers;
        request.jobs = jobs;
        request.attachments = attachments;

        res.json({ success: true, data: request });
    } catch (error) {
        console.error("Error fetching request:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch request"
        });
    }
};


// POST /api/requests/:id/cancel  (CUSTOMER - own request, while still open)
const cancel = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({
            success: false,
            message: "Invalid request id"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const customerId = await getCustomerId(req.user.id);

        if (!customerId) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message: "No customer profile associated with this account"
            });
        }

        const [requests] = await connection.query(
            `SELECT id, status FROM service_requests
             WHERE id = ? AND customer_id = ?`,
            [id, customerId]
        );

        if (requests.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (!["OPEN", "OFFERS_RECEIVED"].includes(requests[0].status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This request can no longer be cancelled"
            });
        }

        await connection.query(
            `UPDATE service_requests SET status = 'CANCELLED' WHERE id = ?`,
            [id]
        );

        const [providers] = await connection.query(
            `SELECT DISTINCT pp.user_id
             FROM offers o
             JOIN provider_profiles pp ON pp.id = o.provider_id
             WHERE o.request_id = ? AND o.status = 'PENDING'`,
            [id]
        );

        // Pending offers no longer have a home on a cancelled request
        await connection.query(
            `UPDATE offers SET status = 'WITHDRAWN'
             WHERE request_id = ? AND status = 'PENDING'`,
            [id]
        );

        for (const provider of providers) {
            await createNotification(
                provider.user_id,
                "Request cancelled",
                "A service request you offered on was cancelled by the customer.",
                "REQUEST_CANCELLED",
                connection
            );
        }

        await connection.commit();

        return res.json({
            success: true,
            message: "Request cancelled",
            data: { id }
        });
    } catch (error) {
        await connection.rollback();

        console.error("Error cancelling request:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel request"
        });
    } finally {
        connection.release();
    }
};


module.exports = {
    create,
    listForCustomer,
    getById,
    cancel
};