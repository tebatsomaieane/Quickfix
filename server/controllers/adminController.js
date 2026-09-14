const db = require("../config/db");
const { createNotification } = require("../utils/helpers");


// GET /api/admin/stats
const stats = async (req, res) => {
    try {
        const [
            [users],
            [providers],
            [businesses],
            [requests],
            [jobs],
            [completedJobs],
            [openComplaints],
            [activeAds],
            [products],
            [services]
        ] = await Promise.all([
            db.query("SELECT COUNT(*) AS total FROM users"),
            db.query(
                "SELECT COUNT(*) AS total FROM provider_profiles"
            ),
            db.query("SELECT COUNT(*) AS total FROM businesses"),
            db.query("SELECT COUNT(*) AS total FROM service_requests"),
            db.query("SELECT COUNT(*) AS total FROM jobs"),
            db.query(
                "SELECT COUNT(*) AS total FROM jobs WHERE status = 'COMPLETED'"
            ),
            db.query(
                "SELECT COUNT(*) AS total FROM complaints WHERE status IN ('OPEN', 'UNDER_REVIEW')"
            ),
            db.query(
                "SELECT COUNT(*) AS total FROM advertisements WHERE status = 'ACTIVE'"
            ),
            db.query("SELECT COUNT(*) AS total FROM products"),
            db.query("SELECT COUNT(*) AS total FROM services")
        ]);

        res.json({
            success: true,
            data: {
                users: users[0].total,
                providers: providers[0].total,
                businesses: businesses[0].total,
                requests: requests[0].total,
                jobs: jobs[0].total,
                completedJobs: completedJobs[0].total,
                openComplaints: openComplaints[0].total,
                activeAdvertisements: activeAds[0].total,
                products: products[0].total,
                services: services[0].total
            }
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics"
        });
    }
};


// GET /api/admin/complaints
const listComplaints = async (req, res) => {
    try {
        const [complaints] = await db.query(
            `SELECT c.id, c.subject, c.description, c.status,
                    c.admin_response, c.created_at,
                    u.first_name, u.last_name, u.email, u.role,
                    j.id AS job_id,
                    r.title AS request_title
             FROM complaints c
             JOIN users u ON u.id = c.user_id
             LEFT JOIN jobs j ON j.id = c.job_id
             LEFT JOIN service_requests r ON r.id = j.request_id
             ORDER BY
               CASE c.status
                 WHEN 'OPEN' THEN 0
                 WHEN 'UNDER_REVIEW' THEN 1
                 ELSE 2
               END,
               c.created_at DESC
             LIMIT 200`,
            []
        );

        return res.json({ success: true, data: complaints });
    } catch (error) {
        console.error("Error listing complaints:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load complaints"
        });
    }
};


// PATCH /api/admin/complaints/:id
const updateComplaint = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({
            success: false,
            message: "Invalid complaint id"
        });
    }

    const { status, admin_response } = req.body;

    if (
        status !== undefined &&
        !["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"].includes(status)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid complaint status"
        });
    }

    if (
        (status === undefined || !["RESOLVED", "REJECTED"].includes(status)) &&
        admin_response === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "Nothing to update"
        });
    }

    try {
        const [complaints] = await db.query(
            `SELECT id, user_id, status FROM complaints WHERE id = ?`,
            [id]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        await db.query(
            `UPDATE complaints
             SET status = COALESCE(?, status),
                 admin_response = COALESCE(?, admin_response)
             WHERE id = ?`,
            [status ?? null, admin_response ?? null, id]
        );

        await createNotification(
            complaints[0].user_id,
            "Complaint update",
            `Your complaint status is now ${(status || complaints[0].status)
                .toLowerCase()
                .replace("_", " ")}.`,
            "COMPLAINT_UPDATED"
        );

        return res.json({
            success: true,
            message: "Complaint updated",
            data: { id }
        });
    } catch (error) {
        console.error("Error updating complaint:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update complaint"
        });
    }
};


// GET /api/admin/verification
const listVerification = async (req, res) => {
    try {
        const [requests] = await db.query(
            `SELECT vr.id, vr.status, vr.admin_notes, vr.document_url,
                    vr.identity_information, vr.professional_information,
                    vr.qualification_information,
                    vr.provider_id, vr.created_at,
                    u.first_name, u.last_name, u.email, u.phone,
                    pp.location, pp.service_area
             FROM verification_requests vr
             JOIN provider_profiles pp ON pp.id = vr.provider_id
             JOIN users u ON u.id = pp.user_id
             ORDER BY
               CASE vr.status
                 WHEN 'PENDING' THEN 0
                 WHEN 'UNDER_REVIEW' THEN 1
                 ELSE 2
               END,
               vr.created_at DESC
             LIMIT 200`,
            []
        );

        return res.json({ success: true, data: requests });
    } catch (error) {
        console.error("Error listing verification requests:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load verification requests"
        });
    }
};


// PATCH /api/admin/verification/:id
const reviewVerification = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({
            success: false,
            message: "Invalid verification request id"
        });
    }

    const { status, admin_notes } = req.body;

    if (
        status !== undefined &&
        !["UNDER_REVIEW", "APPROVED", "REJECTED"].includes(status)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid verification status"
        });
    }

    if (status === undefined && admin_notes === undefined) {
        return res.status(400).json({
            success: false,
            message: "Nothing to update"
        });
    }

    try {
        const [rows] = await db.query(
            `SELECT vr.id, vr.status, vr.provider_id,
                    u.id AS user_id
             FROM verification_requests vr
             JOIN provider_profiles pp ON pp.id = vr.provider_id
             JOIN users u ON u.id = pp.user_id
             WHERE vr.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Verification request not found"
            });
        }

        const current = rows[0];

        await db.query(
            `UPDATE verification_requests
             SET status = COALESCE(?, status),
                 admin_notes = COALESCE(?, admin_notes)
             WHERE id = ?`,
            [status ?? null, admin_notes ?? null, id]
        );

        const nextStatus = status || current.status;

        if (["APPROVED", "REJECTED"].includes(nextStatus)) {
            await db.query(
                "UPDATE provider_profiles SET verification_status = ? WHERE id = ?",
                [nextStatus, current.provider_id]
            );

            const message =
                nextStatus === "APPROVED"
                    ? "Congratulations, your provider profile has been verified."
                    : "Your verification request was rejected. Update your information and resubmit.";

            await createNotification(
                current.user_id,
                nextStatus === "APPROVED"
                    ? "Profile verified"
                    : "Verification rejected",
                message,
                nextStatus === "APPROVED"
                    ? "VERIFICATION_APPROVED"
                    : "VERIFICATION_REJECTED"
            );
        }

        return res.json({
            success: true,
            message: "Verification request updated",
            data: { id }
        });
    } catch (error) {
        console.error("Error updating verification request:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update verification request"
        });
    }
};


// ────────────────────────────────────────────────────────
// BUSINESS ADMIN
// ────────────────────────────────────────────────────────

const listBusinesses = async (req, res) => {
    try {
        const [businesses] = await db.query(
            `SELECT b.id, b.name, b.description, b.phone, b.email,
                    b.location, b.operating_hours, b.verification_status,
                    b.created_at,
                    u.id AS owner_user_id, u.first_name, u.last_name,
                    u.email AS owner_email
             FROM businesses b
             JOIN users u ON u.id = b.owner_id
             ORDER BY b.created_at DESC
             LIMIT 200`
        );

        return res.json({ success: true, data: businesses });
    } catch (error) {
        console.error("Error listing businesses:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load businesses"
        });
    }
};


const reviewBusinessVerification = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({
            success: false,
            message: "Invalid business id"
        });
    }

    const { verification_status, admin_notes } = req.body;

    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (verification_status !== undefined && !validStatuses.includes(verification_status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid verification status"
        });
    }

    if (verification_status === undefined && admin_notes === undefined) {
        return res.status(400).json({
            success: false,
            message: "Nothing to update"
        });
    }

    try {
        const [rows] = await db.query(
            `SELECT b.id, b.verification_status, b.owner_id,
                    u.id AS user_id
             FROM businesses b
             JOIN users u ON u.id = b.owner_id
             WHERE b.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        const current = rows[0];

        await db.query(
            `UPDATE businesses
             SET verification_status = COALESCE(?, verification_status)
             WHERE id = ?`,
            [verification_status ?? null, id]
        );

        const nextStatus = verification_status || current.verification_status;

        if (["APPROVED", "REJECTED"].includes(nextStatus)) {
            const message =
                nextStatus === "APPROVED"
                    ? "Your business has been verified. Customers can see the verified badge."
                    : "Your business verification was rejected. Please update your profile and resubmit.";

            await createNotification(
                current.user_id,
                nextStatus === "APPROVED" ? "Business verified" : "Business verification rejected",
                message,
                nextStatus === "APPROVED"
                    ? "BUSINESS_VERIFICATION_APPROVED"
                    : "BUSINESS_VERIFICATION_REJECTED"
            );
        }

        return res.json({
            success: true,
            message: "Business verification updated",
            data: { id }
        });
    } catch (error) {
        console.error("Error reviewing business verification:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update business verification"
        });
    }
};


// ────────────────────────────────────────────────────────
// USER MANAGEMENT
// ────────────────────────────────────────────────────────

// GET /api/admin/users
const listUsers = async (req, res) => {
    try {
        const { q, role } = req.query;
        const conditions = [];
        const params = [];

        if (q) {
            conditions.push(
                "(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)"
            );
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }

        if (role && ["CUSTOMER", "PROVIDER", "BUSINESS_OWNER", "ADMIN"].includes(role)) {
            conditions.push("u.role = ?");
            params.push(role);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const [users] = await db.query(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
                    u.role, u.email_verified, u.is_active, u.created_at,
                    cp.location AS customer_location,
                    pp.location AS provider_location,
                    pp.verification_status AS provider_verification_status,
                    b.name AS business_name,
                    b.verification_status AS business_verification_status
             FROM users u
             LEFT JOIN customer_profiles cp ON cp.user_id = u.id
             LEFT JOIN provider_profiles pp ON pp.user_id = u.id
             LEFT JOIN businesses b ON b.owner_id = u.id
             ${whereClause}
             ORDER BY u.created_at DESC
             LIMIT 200`,
            params
        );

        return res.json({ success: true, data: users });
    } catch (error) {
        console.error("Error listing users:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load users"
        });
    }
};


// PATCH /api/admin/users/:id  { is_active, role }
const updateUser = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({
            success: false,
            message: "Invalid user id"
        });
    }

    const { is_active, role } = req.body;

    if (Number(id) === req.user.id) {
        return res.status(400).json({
            success: false,
            message: "You cannot modify your own account"
        });
    }

    if (is_active === undefined && role === undefined) {
        return res.status(400).json({
            success: false,
            message: "Nothing to update"
        });
    }

    if (role !== undefined && !["CUSTOMER", "PROVIDER", "BUSINESS_OWNER", "ADMIN"].includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Invalid role"
        });
    }

    try {
        const [users] = await db.query("SELECT id FROM users WHERE id = ?", [id]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await db.query(
            `UPDATE users
             SET is_active = COALESCE(?, is_active),
                 role = COALESCE(?, role)
             WHERE id = ?`,
            [is_active ?? null, role ?? null, id]
        );

        return res.json({
            success: true,
            message: "User updated",
            data: { id: Number(id) }
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update user"
        });
    }
};


// ────────────────────────────────────────────────────────
// PROVIDER MANAGEMENT (ADMIN)
// ────────────────────────────────────────────────────────

// GET /api/admin/providers
const listAdminProviders = async (req, res) => {
    try {
        const { q, verified } = req.query;
        const conditions = ["1 = 1"];
        const params = [];

        if (q) {
            conditions.push(
                "(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)"
            );
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }

        if (verified && ["APPROVED", "PENDING", "REJECTED"].includes(verified)) {
            conditions.push("pp.verification_status = ?");
            params.push(verified);
        }

        const [providers] = await db.query(
            `SELECT pp.id, pp.user_id, pp.description, pp.profile_image,
                    pp.experience_years, pp.location, pp.service_area,
                    pp.verification_status, pp.created_at,
                    u.first_name, u.last_name, u.email, u.phone, u.is_active,
                    (SELECT COUNT(*) FROM jobs j
                     WHERE j.provider_id = pp.id AND j.status = 'COMPLETED') AS completed_jobs,
                    (SELECT ROUND(AVG(r.rating), 1) FROM reviews r
                     WHERE r.provider_id = pp.id) AS rating,
                    (SELECT COUNT(*) FROM reviews r
                     WHERE r.provider_id = pp.id) AS review_count
             FROM provider_profiles pp
             JOIN users u ON u.id = pp.user_id
             WHERE ${conditions.join(" AND ")}
             ORDER BY pp.created_at DESC
             LIMIT 200`,
            params
        );

        return res.json({ success: true, data: providers });
    } catch (error) {
        console.error("Error listing providers:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load providers"
        });
    }
};


// ────────────────────────────────────────────────────────
// ADVERTISEMENT MANAGEMENT (ADMIN)
// ────────────────────────────────────────────────────────

// GET /api/admin/advertisements
const listAdvertisements = async (req, res) => {
    try {
        const { status } = req.query;

        const conditions = ["1 = 1"];
        const params = [];

        if (status && ["PENDING", "ACTIVE", "PAUSED", "EXPIRED", "REJECTED"].includes(status)) {
            conditions.push("a.status = ?");
            params.push(status);
        }

        const [rows] = await db.query(
            `SELECT a.id, a.title, a.description, a.image, a.service_id,
                    a.start_date, a.end_date, a.status, a.created_at,
                    b.id AS business_id, b.name AS business_name,
                    s.name AS service_name
             FROM advertisements a
             JOIN businesses b ON b.id = a.business_id
             LEFT JOIN services s ON s.id = a.service_id
             WHERE ${conditions.join(" AND ")}
             ORDER BY a.created_at DESC
             LIMIT 200`,
            params
        );

        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error listing advertisements:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load advertisements"
        });
    }
};


// PATCH /api/admin/advertisements/:id  { status }
const reviewAdvertisement = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({
            success: false,
            message: "Invalid advertisement id"
        });
    }

    const { status } = req.body;

    if (!["ACTIVE", "REJECTED", "PAUSED"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be ACTIVE, REJECTED or PAUSED"
        });
    }

    try {
        const [rows] = await db.query(
            `SELECT a.id, b.owner_id AS user_id, a.title
             FROM advertisements a
             JOIN businesses b ON b.id = a.business_id
             WHERE a.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Advertisement not found"
            });
        }

        await db.query(
            "UPDATE advertisements SET status = ? WHERE id = ?",
            [status, id]
        );

        await createNotification(
            rows[0].user_id,
            status === "ACTIVE" ? "Advertisement approved" : "Advertisement review update",
            status === "ACTIVE"
                ? `Your advertisement "${rows[0].title}" is now live.`
                : `Your advertisement "${rows[0].title}" was updated to ${status}.`,
            status === "ACTIVE" ? "ADVERTISEMENT_APPROVED" : "ADVERTISEMENT_STATUS_CHANGED"
        );

        return res.json({
            success: true,
            message: "Advertisement review updated",
            data: { id: Number(id), status }
        });
    } catch (error) {
        console.error("Error reviewing advertisement:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update advertisement"
        });
    }
};


// ────────────────────────────────────────────────────────
// PROMOTION MANAGEMENT (ADMIN)
// ────────────────────────────────────────────────────────

// GET /api/admin/promotions
const listPromotions = async (req, res) => {
    try {
        const { status } = req.query;

        const conditions = ["1 = 1"];
        const params = [];

        if (status && ["PENDING", "ACTIVE", "PAUSED", "EXPIRED", "REJECTED"].includes(status)) {
            conditions.push("p.status = ?");
            params.push(status);
        }

        const [rows] = await db.query(
            `SELECT p.id, p.title, p.description, p.discount, p.service_id,
                    p.start_date, p.end_date, p.status, p.created_at,
                    b.id AS business_id, b.name AS business_name,
                    s.name AS service_name
             FROM promotions p
             JOIN businesses b ON b.id = p.business_id
             LEFT JOIN services s ON s.id = p.service_id
             WHERE ${conditions.join(" AND ")}
             ORDER BY p.created_at DESC
             LIMIT 200`,
            params
        );

        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error listing promotions:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load promotions"
        });
    }
};


// PATCH /api/admin/promotions/:id  { status }
const reviewPromotion = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({
            success: false,
            message: "Invalid promotion id"
        });
    }

    const { status } = req.body;

    if (!["ACTIVE", "REJECTED", "PAUSED"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be ACTIVE, REJECTED or PAUSED"
        });
    }

    try {
        const [rows] = await db.query(
            `SELECT p.id, b.owner_id AS user_id, p.title
             FROM promotions p
             JOIN businesses b ON b.id = p.business_id
             WHERE p.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Promotion not found"
            });
        }

        await db.query(
            "UPDATE promotions SET status = ? WHERE id = ?",
            [status, id]
        );

        await createNotification(
            rows[0].user_id,
            status === "ACTIVE" ? "Promotion approved" : "Promotion review update",
            status === "ACTIVE"
                ? `Your promotion "${rows[0].title}" is now active.`
                : `Your promotion "${rows[0].title}" was updated to ${status}.`,
            status === "ACTIVE" ? "PROMOTION_APPROVED" : "PROMOTION_STATUS_CHANGED"
        );

        return res.json({
            success: true,
            message: "Promotion review updated",
            data: { id: Number(id), status }
        });
    } catch (error) {
        console.error("Error reviewing promotion:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update promotion"
        });
    }
};


module.exports = {
    stats,
    listComplaints,
    updateComplaint,
    listVerification,
    reviewVerification,
    listBusinesses,
    reviewBusinessVerification,
    listUsers,
    updateUser,
    listAdminProviders,
    listAdvertisements,
    reviewAdvertisement,
    listPromotions,
    reviewPromotion
};