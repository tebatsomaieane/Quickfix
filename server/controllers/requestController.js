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

        // 1. Required fields
        if (!service_id || !title || !description || !location) {
            return res.status(400).json({
                success: false,
                message: "Service, title, description and location are required"
            });
        }

        if (!title.trim() || !description.trim() || !location.trim()) {
            return res.status(400).json({
                success: false,
                message: "Title, description and location cannot be empty"
            });
        }

        if (title.trim().length > 200) {
            return res.status(400).json({
                success: false,
                message: "Title must be 200 characters or fewer"
            });
        }

        if (description.trim().length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Description must be 5000 characters or fewer"
            });
        }

        if (location.trim().length > 255) {
            return res.status(400).json({
                success: false,
                message: "Location must be 255 characters or fewer"
            });
        }

        // 2. Budget validation
        let bMin = budget_min;
        let bMax = budget_max;

        if (bMin !== undefined && bMin !== null && bMin !== "") {
            bMin = Number(bMin);

            if (!Number.isFinite(bMin) || bMin < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Minimum budget must be a positive number"
                });
            }
        } else {
            bMin = null;
        }

        if (bMax !== undefined && bMax !== null && bMax !== "") {
            bMax = Number(bMax);

            if (!Number.isFinite(bMax) || bMax < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum budget must be a positive number"
                });
            }
        } else {
            bMax = null;
        }

        if (bMin !== null && bMax !== null && bMin > bMax) {
            return res.status(400).json({
                success: false,
                message: "Minimum budget cannot be greater than maximum budget"
            });
        }

        // 3. Verify the service exists and is active
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

        // 4. Map user to customer profile
        const customerId = await getCustomerId(req.user.id);

        if (!customerId) {
            return res.status(403).json({
                success: false,
                message: "No customer profile associated with this account"
            });
        }

        // 5. Create the request
        const [result] = await db.query(
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

        res.status(201).json({
            success: true,
            message: "Service request posted successfully",
            data: { id: result.insertId }
        });
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

        request.offers = offers;
        request.jobs = jobs;

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