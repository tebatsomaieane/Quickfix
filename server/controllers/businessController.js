const db = require("../config/db");
const { createNotification } = require("../utils/helpers");


// Helper: resolve the business id for a logged-in BUSINESS_OWNER
const getBusinessId = async (userId) => {
    const [rows] = await db.query(
        "SELECT id FROM businesses WHERE owner_id = ?",
        [userId]
    );
    return rows.length ? rows[0].id : null;
};


// ──────────────────────────────────────────────
// BUSINESS PROFILE
// ──────────────────────────────────────────────

const getProfile = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);

        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found for this account"
            });
        }

        const [rows] = await db.query(
            `SELECT id, owner_id, name, description, logo, cover_image,
                    phone, email, location, operating_hours,
                    verification_status, created_at, updated_at
             FROM businesses WHERE id = ?`,
            [businessId]
        );

        return res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error fetching business profile:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load business profile"
        });
    }
};


const updateProfile = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);

        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found for this account"
            });
        }

        const {
            name,
            description,
            logo,
            cover_image,
            phone,
            email,
            location,
            operating_hours
        } = req.body;

        if (name !== undefined) {
            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Business name cannot be empty"
                });
            }

            if (name.trim().length > 200) {
                return res.status(400).json({
                    success: false,
                    message: "Business name must be 200 characters or fewer"
                });
            }
        }

        const fields = {};
        if (name !== undefined) fields.name = name.trim();
        if (description !== undefined) fields.description = (description || "").trim() || null;
        if (logo !== undefined) fields.logo = (logo || "").trim() || null;
        if (cover_image !== undefined) fields.cover_image = (cover_image || "").trim() || null;
        if (phone !== undefined) fields.phone = (phone || "").trim() || null;
        if (email !== undefined) fields.email = (email || "").trim() || null;
        if (location !== undefined) fields.location = (location || "").trim() || null;
        if (operating_hours !== undefined) fields.operating_hours = (operating_hours || "").trim() || null;

        if (Object.keys(fields).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Nothing to update"
            });
        }

        // Allowlist of updatable columns — never interpolate user keys.
        const ALLOWED_COLUMNS = new Set([
            "name", "description", "logo", "cover_image",
            "phone", "email", "location", "operating_hours"
        ]);

        const setClauses = [];
        const params = [];

        for (const key of Object.keys(fields)) {
            if (ALLOWED_COLUMNS.has(key)) {
                setClauses.push(`${key} = ?`);
                params.push(fields[key]);
            }
        }

        params.push(businessId);

        await db.query(
            `UPDATE businesses SET ${setClauses.join(", ")} WHERE id = ?`,
            params
        );

        return res.json({
            success: true,
            message: "Business profile updated",
            data: { id: businessId }
        });
    } catch (error) {
        console.error("Error updating business profile:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update business profile"
        });
    }
};


// ──────────────────────────────────────────────
// PRODUCTS
// ──────────────────────────────────────────────

const getMyProducts = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const [rows] = await db.query(
            `SELECT p.*, c.name AS category_name
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.business_id = ?
             ORDER BY p.created_at DESC`,
            [businessId]
        );

        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching business products:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load products"
        });
    }
};


const createProduct = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const { name, description, price, category_id, image } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Product name is required"
            });
        }

        if (name.trim().length > 200) {
            return res.status(400).json({
                success: false,
                message: "Product name must be 200 characters or fewer"
            });
        }

        if (price === undefined || price === null || !Number.isFinite(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: "A valid price is required"
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM products WHERE business_id = ? AND name = ?",
            [businessId, name.trim()]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A product with this name already exists"
            });
        }

        const [result] = await db.query(
            `INSERT INTO products
                (business_id, name, description, price, category_id, image)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                businessId,
                name.trim(),
                (description || "").trim() || null,
                Number(price),
                category_id ? Number(category_id) : null,
                (image || "").trim() || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Product created",
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error("Error creating product:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create product"
        });
    }
};


const updateProduct = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM products WHERE id = ? AND business_id = ?",
            [id, businessId]
        );
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const { name, description, price, category_id, image, status } = req.body;

        if (name !== undefined && (!name || !name.trim())) {
            return res.status(400).json({
                success: false,
                message: "Product name cannot be empty"
            });
        }

        if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        if (status !== undefined && !["ACTIVE", "INACTIVE"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be ACTIVE or INACTIVE"
            });
        }

        await db.query(
            `UPDATE products
             SET name = COALESCE(?, name),
                 description = COALESCE(?, description),
                 price = COALESCE(?, price),
                 category_id = COALESCE(?, category_id),
                 image = COALESCE(?, image),
                 status = COALESCE(?, status)
             WHERE id = ?`,
            [
                name?.trim() ?? null,
                description?.trim() ?? null,
                price !== undefined ? Number(price) : null,
                category_id ?? null,
                image?.trim() ?? null,
                status ?? null,
                id
            ]
        );

        return res.json({
            success: true,
            message: "Product updated",
            data: { id }
        });
    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update product"
        });
    }
};


const deleteProduct = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM products WHERE id = ? AND business_id = ?",
            [id, businessId]
        );
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await db.query("DELETE FROM products WHERE id = ?", [id]);

        return res.json({ success: true, message: "Product deleted" });
    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete product"
        });
    }
};


// ──────────────────────────────────────────────
// ADVERTISEMENTS
// ──────────────────────────────────────────────

const getMyAdvertisements = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const [rows] = await db.query(
            `SELECT a.*, s.name AS service_name
             FROM advertisements a
             LEFT JOIN services s ON s.id = a.service_id
             WHERE a.business_id = ?
             ORDER BY a.created_at DESC`,
            [businessId]
        );

        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching business advertisements:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load advertisements"
        });
    }
};


const createAdvertisement = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const { title, description, image, service_id, start_date, end_date } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Advertisement title is required"
            });
        }

        if (title.trim().length > 200) {
            return res.status(400).json({
                success: false,
                message: "Title must be 200 characters or fewer"
            });
        }

        if (!start_date) {
            return res.status(400).json({
                success: false,
                message: "Start date is required"
            });
        }

        if (!end_date) {
            return res.status(400).json({
                success: false,
                message: "End date is required"
            });
        }

        if (new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({
                success: false,
                message: "End date must be on or after the start date"
            });
        }

        const [result] = await db.query(
            `INSERT INTO advertisements
                (business_id, title, description, image, service_id, start_date, end_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                businessId,
                title.trim(),
                (description || "").trim() || null,
                (image || "").trim() || null,
                service_id || null,
                start_date,
                end_date,
                // Business owners never publish directly — admin review decides.
                "PENDING"
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Advertisement created and submitted for admin approval",
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error("Error creating advertisement:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create advertisement"
        });
    }
};


const updateAdvertisement = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid advertisement id"
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM advertisements WHERE id = ? AND business_id = ?",
            [id, businessId]
        );
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Advertisement not found"
            });
        }

        const { title, description, image, service_id, start_date, end_date, status } = req.body;

        if (title !== undefined && (!title || !title.trim())) {
            return res.status(400).json({
                success: false,
                message: "Title cannot be empty"
            });
        }

        if (status !== undefined && !["PENDING", "PAUSED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Owners may only set status to PENDING or PAUSED"
            });
        }

        await db.query(
            `UPDATE advertisements
             SET title = COALESCE(?, title),
                 description = COALESCE(?, description),
                 image = COALESCE(?, image),
                 service_id = COALESCE(?, service_id),
                 start_date = COALESCE(?, start_date),
                 end_date = COALESCE(?, end_date),
                 status = COALESCE(?, status)
             WHERE id = ?`,
            [
                title?.trim() ?? null,
                description?.trim() ?? null,
                image?.trim() ?? null,
                service_id ?? null,
                start_date ?? null,
                end_date ?? null,
                status ?? null,
                id
            ]
        );

        return res.json({
            success: true,
            message: "Advertisement updated",
            data: { id }
        });
    } catch (error) {
        console.error("Error updating advertisement:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update advertisement"
        });
    }
};


const deleteAdvertisement = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid advertisement id"
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM advertisements WHERE id = ? AND business_id = ?",
            [id, businessId]
        );
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Advertisement not found"
            });
        }

        await db.query("DELETE FROM advertisements WHERE id = ?", [id]);

        return res.json({ success: true, message: "Advertisement deleted" });
    } catch (error) {
        console.error("Error deleting advertisement:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete advertisement"
        });
    }
};


// ──────────────────────────────────────────────
// PROMOTIONS
// ──────────────────────────────────────────────

const getMyPromotions = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const [rows] = await db.query(
            `SELECT pr.*, s.name AS service_name
             FROM promotions pr
             LEFT JOIN services s ON s.id = pr.service_id
             WHERE pr.business_id = ?
             ORDER BY pr.created_at DESC`,
            [businessId]
        );

        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching business promotions:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load promotions"
        });
    }
};


const createPromotion = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const { title, description, discount, service_id, start_date, end_date } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Promotion title is required"
            });
        }

        if (title.trim().length > 200) {
            return res.status(400).json({
                success: false,
                message: "Title must be 200 characters or fewer"
            });
        }

        if (discount === undefined || discount === null || Number(discount) < 0 || Number(discount) > 100) {
            return res.status(400).json({
                success: false,
                message: "Discount must be between 0 and 100"
            });
        }

        if (!start_date) {
            return res.status(400).json({
                success: false,
                message: "Start date is required"
            });
        }

        if (!end_date) {
            return res.status(400).json({
                success: false,
                message: "End date is required"
            });
        }

        if (new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({
                success: false,
                message: "End date must be on or after the start date"
            });
        }

        const [result] = await db.query(
            `INSERT INTO promotions
                (business_id, title, description, discount, service_id, start_date, end_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                businessId,
                title.trim(),
                (description || "").trim() || null,
                Number(discount),
                service_id || null,
                start_date,
                end_date,
                // Business owners never publish directly — admin review decides.
                "PENDING"
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Promotion created and submitted for admin approval",
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error("Error creating promotion:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create promotion"
        });
    }
};


const updatePromotion = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid promotion id"
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM promotions WHERE id = ? AND business_id = ?",
            [id, businessId]
        );
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Promotion not found"
            });
        }

        const { title, description, discount, service_id, start_date, end_date, status } = req.body;

        if (title !== undefined && (!title || !title.trim())) {
            return res.status(400).json({
                success: false,
                message: "Title cannot be empty"
            });
        }

        if (discount !== undefined && (Number(discount) < 0 || Number(discount) > 100)) {
            return res.status(400).json({
                success: false,
                message: "Discount must be between 0 and 100"
            });
        }

        if (status !== undefined && !["PENDING", "PAUSED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Owners may only set status to PENDING or PAUSED"
            });
        }

        await db.query(
            `UPDATE promotions
             SET title = COALESCE(?, title),
                 description = COALESCE(?, description),
                 discount = COALESCE(?, discount),
                 service_id = COALESCE(?, service_id),
                 start_date = COALESCE(?, start_date),
                 end_date = COALESCE(?, end_date),
                 status = COALESCE(?, status)
             WHERE id = ?`,
            [
                title?.trim() ?? null,
                description?.trim() ?? null,
                discount !== undefined ? Number(discount) : null,
                service_id ?? null,
                start_date ?? null,
                end_date ?? null,
                status ?? null,
                id
            ]
        );

        return res.json({
            success: true,
            message: "Promotion updated",
            data: { id }
        });
    } catch (error) {
        console.error("Error updating promotion:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update promotion"
        });
    }
};


const deletePromotion = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid promotion id"
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM promotions WHERE id = ? AND business_id = ?",
            [id, businessId]
        );
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Promotion not found"
            });
        }

        await db.query("DELETE FROM promotions WHERE id = ?", [id]);

        return res.json({ success: true, message: "Promotion deleted" });
    } catch (error) {
        console.error("Error deleting promotion:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete promotion"
        });
    }
};


// ──────────────────────────────────────────────
// ANALYTICS
// ──────────────────────────────────────────────

const analytics = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const [
            productRows,
            adRows,
            promoRows,
            providerRows
        ] = await Promise.all([
            db.query(
                `SELECT
                    COUNT(*) AS total_products,
                    SUM(status = 'ACTIVE') AS active_products,
                    SUM(status = 'INACTIVE') AS inactive_products
                 FROM products WHERE business_id = ?`,
                [businessId]
            ),
            db.query(
                `SELECT
                    COUNT(*) AS total,
                    SUM(status = 'ACTIVE') AS active,
                    SUM(status = 'PENDING') AS pending,
                    SUM(status IN ('PAUSED','EXPIRED','REJECTED')) AS inactive
                 FROM advertisements WHERE business_id = ?`,
                [businessId]
            ),
            db.query(
                `SELECT
                    COUNT(*) AS total,
                    SUM(status = 'ACTIVE') AS active,
                    SUM(status = 'PENDING') AS pending,
                    SUM(status IN ('PAUSED','EXPIRED','REJECTED')) AS inactive
                 FROM promotions WHERE business_id = ?`,
                [businessId]
            ),
            db.query(
                "SELECT COUNT(*) AS count FROM business_providers WHERE business_id = ?",
                [businessId]
            )
        ]);

        const productStats   = productRows[0][0];
        const adStats        = adRows[0][0];
        const promoStats     = promoRows[0][0];
        const providerCount  = providerRows[0][0];

        return res.json({
            success: true,
            data: {
                products: {
                    total: Number(productStats.total_products) || 0,
                    active: Number(productStats.active_products) || 0,
                    inactive: Number(productStats.inactive_products) || 0
                },
                advertisements: {
                    total: Number(adStats.total) || 0,
                    active: Number(adStats.active) || 0,
                    pending: Number(adStats.pending) || 0,
                    inactive: Number(adStats.inactive) || 0
                },
                promotions: {
                    total: Number(promoStats.total) || 0,
                    active: Number(promoStats.active) || 0,
                    pending: Number(promoStats.pending) || 0,
                    inactive: Number(promoStats.inactive) || 0
                },
                linkedProviders: Number(providerCount.count) || 0
            }
        });
    } catch (error) {
        console.error("Error fetching business analytics:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load analytics"
        });
    }
};


// ──────────────────────────────────────────────
// BUSINESS VERIFICATION
// ──────────────────────────────────────────────

const requestVerification = async (req, res) => {
    try {
        const businessId = await getBusinessId(req.user.id);
        if (!businessId) {
            return res.status(404).json({
                success: false,
                message: "No business profile found"
            });
        }

        const [rows] = await db.query(
            "SELECT verification_status FROM businesses WHERE id = ?",
            [businessId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Business profile not found"
            });
        }

        const { verification_status } = rows[0];

        if (verification_status === "APPROVED") {
            return res.status(400).json({
                success: false,
                message: "Your business is already verified"
            });
        }

        if (verification_status === "PENDING") {
            return res.status(400).json({
                success: false,
                message: "You already have a pending verification request"
            });
        }

        await db.query(
            "UPDATE businesses SET verification_status = 'PENDING' WHERE id = ?",
            [businessId]
        );

        const [admins] = await db.query(
            "SELECT id FROM users WHERE role = 'ADMIN'"
        );

        for (const admin of admins) {
            await createNotification(
                admin.id,
                "Business verification request",
                "A business owner has submitted a verification request.",
                "BUSINESS_VERIFICATION_SUBMITTED"
            );
        }

        return res.json({
            success: true,
            message: "Verification request submitted"
        });
    } catch (error) {
        console.error("Error requesting business verification:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit verification request"
        });
    }
};


module.exports = {
    getProfile,
    updateProfile,
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getMyAdvertisements,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    getMyPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    analytics,
    requestVerification
};