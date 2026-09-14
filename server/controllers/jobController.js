const db = require("../config/db");
const {
    createNotification,
    getProviderId,
    getCustomerId
} = require("../utils/helpers");


const JOB_JOIN = `
    SELECT j.id, j.request_id, j.offer_id, j.customer_id, j.provider_id,
           j.status, j.started_at, j.completed_at, j.created_at,
           r.title AS request_title, r.location AS request_location,
           s.name AS service_name,
           cp.first_name AS customer_first_name,
           cp.last_name AS customer_last_name,
           pp.first_name AS provider_first_name,
           pp.last_name AS provider_last_name,
           o.price AS offer_price
    FROM jobs j
    JOIN service_requests r ON r.id = j.request_id
    JOIN services s ON s.id = r.service_id
    JOIN customer_profiles cus ON cus.id = j.customer_id
    JOIN users cp ON cp.id = cus.user_id
    JOIN provider_profiles prov ON prov.id = j.provider_id
    JOIN users pp ON pp.id = prov.user_id
    JOIN offers o ON o.id = j.offer_id
`;


const verifyJobAccess = async (job, userId) => {
    const customerId = await getCustomerId(userId);
    const providerId = await getProviderId(userId);

    if (customerId === job.customer_id || providerId === job.provider_id) {
        return true;
    }

    return false;
};


// GET /api/jobs/my  (CUSTOMER or PROVIDER)
const listMine = async (req, res) => {
    try {
        const customerId = await getCustomerId(req.user.id);
        const providerId = await getProviderId(req.user.id);

        if (!customerId && !providerId) {
            return res.status(403).json({
                success: false,
                message: "No customer or provider profile associated"
            });
        }

        const [jobs] = await db.query(
            `${JOB_JOIN}
             WHERE (? IS NULL OR j.customer_id = ?)
                AND (? IS NULL OR j.provider_id = ?)
             ORDER BY j.created_at DESC`,
            [customerId, customerId, providerId, providerId]
        );

        return res.json({ success: true, data: jobs });
    } catch (error) {
        console.error("Error listing jobs:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to list jobs"
        });
    }
};


// GET /api/jobs/:id  (involved customer or provider)
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid job id"
            });
        }

        const [jobs] = await db.query(
            `${JOB_JOIN}
             WHERE j.id = ?`,
            [id]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const job = jobs[0];

        const hasAccess = await verifyJobAccess(job, req.user.id);

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this job"
            });
        }

        // Attach review so the customer knows if it is already reviewed
        const [reviews] = await db.query(
            `SELECT id, rating, comment
             FROM reviews WHERE job_id = ?`,
            [job.id]
        );

        return res.json({
            success: true,
            data: { ...job, review: reviews[0] || null }
        });
    } catch (error) {
        console.error("Error fetching job:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch job"
        });
    }
};


// POST /api/jobs/:id/start  (PROVIDER who owns the job)
const start = async (req, res) => {
    const { id } = req.params;

    try {
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid job id"
            });
        }

        const providerId = await getProviderId(req.user.id);

        if (!providerId) {
            return res.status(403).json({
                success: false,
                message: "Provider profile required"
            });
        }

        const [jobs] = await db.query(
            `SELECT id, request_id, provider_id, status
             FROM jobs WHERE id = ?`,
            [id]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const job = jobs[0];

        if (job.provider_id !== providerId) {
            return res.status(403).json({
                success: false,
                message: "You can only start your own jobs"
            });
        }

        if (job.status !== "ASSIGNED") {
            return res.status(400).json({
                success: false,
                message: "Only assigned jobs can be started"
            });
        }

        const [result] = await db.query(
            `UPDATE jobs
             SET status = 'IN_PROGRESS', started_at = NOW()
             WHERE id = ? AND status = 'ASSIGNED'`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: "Job could not be started"
            });
        }

        await db.query(
            `UPDATE service_requests
             SET status = 'IN_PROGRESS'
             WHERE id = ?`,
            [job.request_id]
        );

        // Notify the customer
        const [customerUser] = await db.query(
            `SELECT user_id FROM customer_profiles WHERE id = ?`,
            [job.customer_id]
        );

        if (customerUser.length > 0) {
            await createNotification(
                customerUser[0].user_id,
                "Job started",
                "Your provider has started the job.",
                "JOB_STARTED"
            );
        }

        return res.json({
            success: true,
            message: "Job started"
        });
    } catch (error) {
        console.error("Error starting job:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to start job"
        });
    }
};


// POST /api/jobs/:id/complete  (PROVIDER who owns the job)
const complete = async (req, res) => {
    const { id } = req.params;

    try {
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid job id"
            });
        }

        const providerId = await getProviderId(req.user.id);

        if (!providerId) {
            return res.status(403).json({
                success: false,
                message: "Provider profile required"
            });
        }

        const [jobs] = await db.query(
            `SELECT id, request_id, provider_id, status
             FROM jobs WHERE id = ?`,
            [id]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const job = jobs[0];

        if (job.provider_id !== providerId) {
            return res.status(403).json({
                success: false,
                message: "You can only complete your own jobs"
            });
        }

        if (job.status !== "IN_PROGRESS") {
            return res.status(400).json({
                success: false,
                message: "Job must be started before it can be completed"
            });
        }

        const [result] = await db.query(
            `UPDATE jobs
             SET status = 'COMPLETED', completed_at = NOW()
             WHERE id = ? AND status = 'IN_PROGRESS'`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: "Job could not be completed"
            });
        }

        await db.query(
            `UPDATE service_requests
             SET status = 'COMPLETED'
             WHERE id = ?`,
            [job.request_id]
        );

        // Notify the customer
        const [customerUser] = await db.query(
            `SELECT user_id FROM customer_profiles WHERE id = ?`,
            [job.customer_id]
        );

        if (customerUser.length > 0) {
            await createNotification(
                customerUser[0].user_id,
                "Job completed",
                "Your provider has completed the job. Please leave a review.",
                "JOB_COMPLETED"
            );
        }

        return res.json({
            success: true,
            message: "Job completed"
        });
    } catch (error) {
        console.error("Error completing job:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to complete job"
        });
    }
};


module.exports = {
    listMine,
    getById,
    start,
    complete
};