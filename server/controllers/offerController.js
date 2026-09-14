const db = require("../config/db");
const {
    createNotification,
    getProviderId,
    getCustomerId
} = require("../utils/helpers");


// GET /api/offers/my  (PROVIDER - own offers)
const listMine = async (req, res) => {
    try {
        const providerId = await getProviderId(req.user.id);

        if (!providerId) {
            return res.status(403).json({
                success: false,
                message: "No provider profile associated with this account"
            });
        }

        const [offers] = await db.query(
            `SELECT o.id, o.price, o.message, o.estimated_hours,
                    o.valid_until, o.status, o.created_at,
                    r.id AS request_id, r.title AS request_title,
                    r.location,
                    s.name AS service_name
             FROM offers o
             JOIN service_requests r ON r.id = o.request_id
             JOIN services s ON s.id = r.service_id
             WHERE o.provider_id = ?
             ORDER BY o.created_at DESC
             LIMIT 200`,
            [providerId]
        );

        return res.json({ success: true, data: offers });
    } catch (error) {
        console.error("Error listing provider offers:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load offers"
        });
    }
};


// POST /api/offers  (PROVIDER)
const create = async (req, res) => {
    try {
        const providerId = await getProviderId(req.user.id);

        if (!providerId) {
            return res.status(403).json({
                success: false,
                message: "No provider profile associated with this account"
            });
        }

        const {
            request_id,
            price,
            message,
            estimated_hours,
            valid_until
        } = req.body;

        if (!request_id || price === undefined || price === null) {
            return res.status(400).json({
                success: false,
                message: "Request id and price are required"
            });
        }

        const priceNum = Number(price);

        if (!Number.isFinite(priceNum) || priceNum <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be a positive number"
            });
        }

        if (
            estimated_hours !== undefined &&
            estimated_hours !== null &&
            estimated_hours !== ""
        ) {
            const hours = Number(estimated_hours);

            if (!Number.isFinite(hours) || hours <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Estimated time must be a positive number"
                });
            }
        }

        // Request must be open to offers
        const [requests] = await db.query(
            `SELECT id, status FROM service_requests
             WHERE id = ?`,
            [request_id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (!["OPEN", "OFFERS_RECEIVED"].includes(requests[0].status)) {
            return res.status(400).json({
                success: false,
                message: "This request is no longer accepting offers"
            });
        }

        // One pending offer per provider per request
        const [existing] = await db.query(
            `SELECT id FROM offers
             WHERE request_id = ? AND provider_id = ?
               AND status = 'PENDING'`,
            [request_id, providerId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending offer on this request"
            });
        }

        const [result] = await db.query(
            `INSERT INTO offers
             (request_id, provider_id, price, message, estimated_hours, valid_until)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                request_id,
                providerId,
                priceNum,
                message || null,
                estimated_hours || null,
                valid_until || null
            ]
        );

        // Request now has offers
        if (requests[0].status === "OPEN") {
            await db.query(
                `UPDATE service_requests
                 SET status = 'OFFERS_RECEIVED'
                 WHERE id = ?`,
                [request_id]
            );
        }

        // Notify the request owner
        const [owner] = await db.query(
            `SELECT cp.user_id
             FROM service_requests r
             JOIN customer_profiles cp ON cp.id = r.customer_id
             WHERE r.id = ?`,
            [request_id]
        );

        if (owner.length > 0) {
            await createNotification(
                owner[0].user_id,
                "New offer received",
                "A provider sent you an offer for your request.",
                "OFFER_RECEIVED"
            );
        }

        res.status(201).json({
            success: true,
            message: "Offer submitted successfully",
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error("Error creating offer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create offer"
        });
    }
};


// PUT /api/offers/:id  (PROVIDER - edit own pending offer)
const update = async (req, res) => {
    const { id } = req.params;

    let providerId;

    try {
        providerId = await getProviderId(req.user.id);
    } catch (error) {
        console.error("Error resolving provider id:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to resolve provider profile"
        });
    }

    if (!providerId) {
        return res.status(403).json({
            success: false,
            message: "No provider profile associated with this account"
        });
    }

    const {
        price,
        message,
        estimated_hours,
        valid_until
    } = req.body;

    // Load the offer
    const [offers] = await db.query(
        `SELECT o.id, o.request_id, o.status, r.status AS request_status
         FROM offers o
         JOIN service_requests r ON r.id = o.request_id
         WHERE o.id = ? AND o.provider_id = ?`,
        [id, providerId]
    );

    if (offers.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Offer not found"
        });
    }

    const offer = offers[0];

    if (offer.status !== "PENDING") {
        return res.status(400).json({
            success: false,
            message: "Only pending offers can be edited"
        });
    }

    if (!["OPEN", "OFFERS_RECEIVED"].includes(offer.request_status)) {
        return res.status(400).json({
            success: false,
            message: "This request is no longer accepting offers"
        });
    }

    // Validate the provided fields (at least one must change)
    let priceNum = price;
    let edit = false;

    if (price !== undefined && price !== null && price !== "") {
        priceNum = Number(price);

        if (!Number.isFinite(priceNum) || priceNum <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be a positive number"
            });
        }

        edit = true;
    } else {
        priceNum = null;
    }

    let hours = null;

    if (estimated_hours !== undefined && estimated_hours !== null && estimated_hours !== "") {
        hours = Number(estimated_hours);

        if (!Number.isFinite(hours) || hours <= 0) {
            return res.status(400).json({
                success: false,
                message: "Estimated time must be a positive number"
            });
        }

        edit = true;
    }

    if (message !== undefined) {
        edit = true;
    }

    if (valid_until !== undefined) {
        edit = true;
    }

    if (!edit) {
        return res.status(400).json({
            success: false,
            message: "Nothing to update"
        });
    }

    try {
        await db.query(
            `UPDATE offers
             SET price = COALESCE(?, price),
                 message = COALESCE(?, message),
                 estimated_hours = COALESCE(?, estimated_hours),
                 valid_until = COALESCE(?, valid_until)
             WHERE id = ?`,
            [priceNum, message ?? null, hours, valid_until ?? null, id]
        );

        // Notify the request owner
        const [owner] = await db.query(
            `SELECT cp.user_id
             FROM service_requests r
             JOIN customer_profiles cp ON cp.id = r.customer_id
             WHERE r.id = ?`,
            [offer.request_id]
        );

        if (owner.length > 0) {
            await createNotification(
                owner[0].user_id,
                "Offer updated",
                "A provider updated their offer on your request.",
                "OFFER_UPDATED"
            );
        }

        return res.json({
            success: true,
            message: "Offer updated",
            data: { id }
        });
    } catch (error) {
        console.error("Error updating offer:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update offer"
        });
    }
};


// POST /api/offers/:id/withdraw  (PROVIDER - own pending offer)
const withdraw = async (req, res) => {
    const { id } = req.params;

    let providerId;

    try {
        providerId = await getProviderId(req.user.id);
    } catch (error) {
        console.error("Error resolving provider id:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to resolve provider profile"
        });
    }

    if (!providerId) {
        return res.status(403).json({
            success: false,
            message: "No provider profile associated with this account"
        });
    }

    try {
        const [offers] = await db.query(
            `SELECT id, request_id, status
             FROM offers
             WHERE id = ? AND provider_id = ?`,
            [id, providerId]
        );

        if (offers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Offer not found"
            });
        }

        if (offers[0].status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Only pending offers can be withdrawn"
            });
        }

        await db.query(
            `UPDATE offers SET status = 'WITHDRAWN' WHERE id = ?`,
            [id]
        );

        // Notify the request owner
        const [owner] = await db.query(
            `SELECT cp.user_id
             FROM service_requests r
             JOIN customer_profiles cp ON cp.id = r.customer_id
             WHERE r.id = ?`,
            [offers[0].request_id]
        );

        if (owner.length > 0) {
            await createNotification(
                owner[0].user_id,
                "Offer withdrawn",
                "A provider withdrew their offer on your request.",
                "OFFER_WITHDRAWN"
            );
        }

        return res.json({
            success: true,
            message: "Offer withdrawn",
            data: { id }
        });
    } catch (error) {
        console.error("Error withdrawing offer:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to withdraw offer"
        });
    }
};


// POST /api/offers/:id/accept  (CUSTOMER)
const accept = async (req, res) => {
    const { id } = req.params;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Load the offer
        const [offers] = await connection.query(
            `SELECT o.id, o.request_id, o.provider_id, o.status,
                    r.customer_id, r.status AS request_status
             FROM offers o
             JOIN service_requests r ON r.id = o.request_id
             WHERE o.id = ?`,
            [id]
        );

        if (offers.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Offer not found"
            });
        }

        const offer = offers[0];

        const customerId = await getCustomerId(req.user.id, connection);

        if (!customerId || offer.customer_id !== customerId) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message: "You can only accept offers on your own requests"
            });
        }

        if (offer.status !== "PENDING") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This offer can no longer be accepted"
            });
        }

        if (!["OPEN", "OFFERS_RECEIVED"].includes(offer.request_status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This request is no longer accepting offers"
            });
        }

        // 2. Atomically claim the request (prevents concurrent accepts)
        const [claimResult] = await connection.query(
            `UPDATE service_requests
             SET status = 'PROVIDER_SELECTED'
             WHERE id = ? AND status IN ('OPEN', 'OFFERS_RECEIVED')`,
            [offer.request_id]
        );

        if (claimResult.affectedRows === 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "This request has already been claimed by another offer"
            });
        }

        // 3. Accept this offer, reject the rest
        await connection.query(
            `UPDATE offers SET status = 'ACCEPTED' WHERE id = ?`,
            [offer.id]
        );

        await connection.query(
            `UPDATE offers
             SET status = 'REJECTED'
             WHERE request_id = ? AND id <> ? AND status = 'PENDING'`,
            [offer.request_id, offer.id]
        );

        // 4. Create the job
        const [jobResult] = await connection.query(
            `INSERT INTO jobs
             (request_id, offer_id, customer_id, provider_id, status)
             VALUES (?, ?, ?, ?, 'ASSIGNED')`,
            [
                offer.request_id,
                offer.id,
                offer.customer_id,
                offer.provider_id
            ]
        );

        // 5. Notify the provider (within the transaction)
        const [providerUser] = await connection.query(
            `SELECT user_id FROM provider_profiles WHERE id = ?`,
            [offer.provider_id]
        );

        if (providerUser.length > 0) {
            await createNotification(
                providerUser[0].user_id,
                "Offer accepted",
                "A customer accepted your offer. A job has been created.",
                "OFFER_ACCEPTED",
                connection
            );
        }

        await connection.commit();

        res.json({
            success: true,
            message: "Offer accepted. Job created.",
            data: { jobId: jobResult.insertId }
        });
    } catch (error) {
        await connection.rollback();

        console.error("Error accepting offer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to accept offer"
        });
    } finally {
        connection.release();
    }
};


module.exports = {
    listMine,
    create,
    update,
    withdraw,
    accept
};