const db = require("../config/db");
const {
    createNotification,
    getCustomerId,
    getProviderId
} = require("../utils/helpers");


// POST /api/complaints  (CUSTOMER or PROVIDER)
const create = async (req, res) => {
    try {
        const { subject, description, job_id } = req.body;

        if (!subject || !subject.trim()) {
            return res.status(400).json({
                success: false,
                message: "Subject is required"
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                message: "Description is required"
            });
        }

        if (subject.trim().length > 200) {
            return res.status(400).json({
                success: false,
                message: "Subject must be 200 characters or fewer"
            });
        }

        if (description.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Description must be 5000 characters or fewer"
            });
        }

        const customerId = await getCustomerId(req.user.id);
        const providerId = await getProviderId(req.user.id);

        if (!customerId && !providerId) {
            return res.status(403).json({
                success: false,
                message: "No customer or provider profile associated with this account"
            });
        }

        let jobId = null;

        if (job_id !== undefined && job_id !== null && job_id !== "") {
            jobId = Number(job_id);

            if (!Number.isInteger(jobId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid job id"
                });
            }

            const [jobs] = await db.query(
                `SELECT id FROM jobs
                 WHERE id = ?
                   AND (customer_id = ? OR provider_id = ?)`,
                [jobId, customerId, providerId]
            );

            if (jobs.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You can only raise a complaint about a job you are part of"
                });
            }
        }

        const [result] = await db.query(
            `INSERT INTO complaints (user_id, job_id, subject, description)
             VALUES (?, ?, ?, ?)`,
            [req.user.id, jobId, subject.trim(), description.trim()]
        );

        // Notify all admins
        const [admins] = await db.query(
            "SELECT id FROM users WHERE role = 'ADMIN'"
        );

        for (const admin of admins) {
            await createNotification(
                admin.id,
                "New complaint",
                "A complaint has been submitted and needs review.",
                "COMPLAINT_RECEIVED"
            );
        }

        return res.status(201).json({
            success: true,
            message: "Complaint submitted",
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error("Error creating complaint:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit complaint"
        });
    }
};


// GET /api/complaints/my  (CUSTOMER or PROVIDER)
const listMine = async (req, res) => {
    try {
        const [complaints] = await db.query(
            `SELECT c.id, c.subject, c.status, c.admin_response, c.created_at,
                    j.id AS job_id,
                    r.title AS request_title
             FROM complaints c
             LEFT JOIN jobs j ON j.id = c.job_id
             LEFT JOIN service_requests r ON r.id = j.request_id
             WHERE c.user_id = ?
             ORDER BY c.created_at DESC
             LIMIT 100`,
            [req.user.id]
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


// GET /api/complaints/:id  (owner)
const getById = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
        return res.status(400).json({
            success: false,
            message: "Invalid complaint id"
        });
    }

    try {
        const [complaints] = await db.query(
            `SELECT c.id, c.subject, c.description, c.status,
                    c.admin_response, c.created_at,
                    j.id AS job_id,
                    r.title AS request_title
             FROM complaints c
             LEFT JOIN jobs j ON j.id = c.job_id
             LEFT JOIN service_requests r ON r.id = j.request_id
             WHERE c.id = ? AND c.user_id = ?`,
            [id, req.user.id]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        return res.json({ success: true, data: complaints[0] });
    } catch (error) {
        console.error("Error fetching complaint:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load complaint"
        });
    }
};


module.exports = {
    create,
    listMine,
    getById
};