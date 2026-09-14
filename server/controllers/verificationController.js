const db = require("../config/db");
const { createNotification } = require("../utils/helpers");


// POST /api/provider/verification  (PROVIDER)
const request = async (req, res) => {
    try {
        const {
            identity_information,
            professional_information,
            qualification_information,
            document_url
        } = req.body;

        if (!identity_information || !identity_information.trim()) {
            return res.status(400).json({
                success: false,
                message: "Identity information is required"
            });
        }

        if (!professional_information || !professional_information.trim()) {
            return res.status(400).json({
                success: false,
                message: "Professional information is required"
            });
        }

        if (!qualification_information || !qualification_information.trim()) {
            return res.status(400).json({
                success: false,
                message: "Qualification information is required"
            });
        }

        if (!document_url || !document_url.trim()) {
            return res.status(400).json({
                success: false,
                message: "A supporting document link is required"
            });
        }

        if (!document_url.trim().startsWith("http://") && !document_url.trim().startsWith("https://")) {
            return res.status(400).json({
                success: false,
                message: "Document URL must be a valid HTTP/HTTPS link"
            });
        }

        const [profiles] = await db.query(
            "SELECT id, verification_status FROM provider_profiles WHERE user_id = ?",
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(403).json({
                success: false,
                message: "No provider profile associated with this account"
            });
        }

        const profile = profiles[0];

        if (profile.verification_status === "APPROVED") {
            return res.status(400).json({
                success: false,
                message: "Your provider profile is already verified"
            });
        }

        const [pending] = await db.query(
            `SELECT id FROM verification_requests
             WHERE provider_id = ?
               AND status IN ('PENDING', 'UNDER_REVIEW')
             LIMIT 1`,
            [profile.id]
        );

        if (pending.length > 0) {
            return res.status(400).json({
                success: false,
                message: "You already have a verification request under review"
            });
        }

        const [result] = await db.query(
            `INSERT INTO verification_requests
                (provider_id, identity_information,
                 professional_information, qualification_information,
                 document_url)
             VALUES (?, ?, ?, ?, ?)`,
            [
                profile.id,
                identity_information.trim(),
                professional_information.trim(),
                qualification_information.trim(),
                document_url.trim()
            ]
        );

        // Mark profile as pending verification
        await db.query(
            "UPDATE provider_profiles SET verification_status = 'PENDING' WHERE id = ?",
            [profile.id]
        );

        const [admins] = await db.query(
            "SELECT id FROM users WHERE role = 'ADMIN'"
        );

        for (const admin of admins) {
            await createNotification(
                admin.id,
                "New verification request",
                "A provider has submitted a verification request.",
                "VERIFICATION_SUBMITTED"
            );
        }

        return res.status(201).json({
            success: true,
            message: "Verification request submitted",
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error("Error submitting verification request:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit verification request"
        });
    }
};


// GET /api/provider/verification  (PROVIDER - own status + latest request)
const mine = async (req, res) => {
    try {
        const [profiles] = await db.query(
            "SELECT id, verification_status FROM provider_profiles WHERE user_id = ?",
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(403).json({
                success: false,
                message: "No provider profile associated with this account"
            });
        }

        const [requests] = await db.query(
            `SELECT vr.id, vr.status, vr.admin_notes, vr.document_url,
                    vr.created_at, vr.updated_at
             FROM verification_requests vr
             WHERE vr.provider_id = ?
             ORDER BY vr.created_at DESC
             LIMIT 1`,
            [profiles[0].id]
        );

        return res.json({
            success: true,
            data: {
                verification_status: profiles[0].verification_status,
                request: requests.length ? requests[0] : null
            }
        });
    } catch (error) {
        console.error("Error fetching verification status:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load verification status"
        });
    }
};


module.exports = {
    request,
    mine
};