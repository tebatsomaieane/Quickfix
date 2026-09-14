const db = require("../config/db");
const {
    getCustomerId,
    getProviderId,
    createNotification
} = require("../utils/helpers");


// POST /api/reviews  { job_id, rating, comment }  (CUSTOMER)
const create = async (req, res) => {
    try {
        const { job_id, rating, comment } = req.body;

        if (!job_id || rating === undefined || rating === null) {
            return res.status(400).json({
                success: false,
                message: "Job id and rating are required"
            });
        }

        const ratingNum = Number(rating);

        if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be a whole number between 1 and 5"
            });
        }

        const customerId = await getCustomerId(req.user.id);

        if (!customerId) {
            return res.status(403).json({
                success: false,
                message: "Customer profile required"
            });
        }

        const [jobs] = await db.query(
            `SELECT id, customer_id, provider_id, status
             FROM jobs WHERE id = ?`,
            [job_id]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const job = jobs[0];

        if (job.customer_id !== customerId) {
            return res.status(403).json({
                success: false,
                message: "You can only review your own jobs"
            });
        }

        if (job.status !== "COMPLETED") {
            return res.status(400).json({
                success: false,
                message: "Only completed jobs can be reviewed"
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM reviews WHERE job_id = ?",
            [job_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: "This job has already been reviewed"
            });
        }

        const [result] = await db.query(
            `INSERT INTO reviews (job_id, customer_id, provider_id, rating, comment)
             VALUES (?, ?, ?, ?, ?)`,
            [
                job_id,
                customerId,
                job.provider_id,
                ratingNum,
                comment || null
            ]
        );

        // Notify the provider
        const [providerUser] = await db.query(
            `SELECT user_id FROM provider_profiles WHERE id = ?`,
            [job.provider_id]
        );

        if (providerUser.length > 0) {
            await createNotification(
                providerUser[0].user_id,
                "New review received",
                `A customer rated your work ${ratingNum}/5.`,
                "REVIEW_RECEIVED"
            );
        }

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error("Error creating review:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create review"
        });
    }
};


// GET /api/reviews/eligible  (CUSTOMER)
// Completed jobs belonging to the customer that have no review yet.
const listEligible = async (req, res) => {
    try {
        const customerId = await getCustomerId(req.user.id);

        if (!customerId) {
            return res.status(403).json({
                success: false,
                message: "Customer profile required"
            });
        }

        const [jobs] = await db.query(
            `SELECT j.id, j.request_id, j.provider_id,
                    j.completed_at,
                    r.title AS request_title,
                    s.name AS service_name,
                    pp.first_name AS provider_first_name,
                    pp.last_name AS provider_last_name
             FROM jobs j
             JOIN service_requests r ON r.id = j.request_id
             JOIN services s ON s.id = r.service_id
             JOIN provider_profiles prov ON prov.id = j.provider_id
             JOIN users pp ON pp.id = prov.user_id
             LEFT JOIN reviews rv ON rv.job_id = j.id
             WHERE j.customer_id = ? AND j.status = 'COMPLETED'
               AND rv.id IS NULL
             ORDER BY j.completed_at DESC`,
            [customerId]
        );

        return res.json({ success: true, data: jobs });
    } catch (error) {
        console.error("Error listing reviewable jobs:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to list reviewable jobs"
        });
    }
};


// POST /api/reviews/:id/respond  (PROVIDER)
// Respond to a review left on one of the provider's jobs.
const respondToReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid review id"
            });
        }

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                success: false,
                message: "Response comment is required"
            });
        }

        if (comment.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Response must be 2000 characters or fewer"
            });
        }

        const providerId = await getProviderId(req.user.id);

        if (!providerId) {
            return res.status(403).json({
                success: false,
                message: "Provider profile required"
            });
        }

        const [reviews] = await db.query(
            `SELECT id, provider_id, provider_response
             FROM reviews WHERE id = ?`,
            [id]
        );

        if (reviews.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        const review = reviews[0];

        if (review.provider_id !== providerId) {
            return res.status(403).json({
                success: false,
                message: "You can only respond to reviews on your own work"
            });
        }

        if (review.provider_response) {
            return res.status(400).json({
                success: false,
                message: "You have already responded to this review"
            });
        }

        await db.query(
            `UPDATE reviews
             SET provider_response = ?,
                 provider_response_at = NOW()
             WHERE id = ?`,
            [comment.trim(), id]
        );

        return res.json({
            success: true,
            message: "Response submitted"
        });
    } catch (error) {
        console.error("Error responding to review:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit response"
        });
    }
};


module.exports = {
    create,
    listEligible,
    respondToReview
};