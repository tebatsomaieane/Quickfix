const db = require("../config/db");


// GET /api/products  (authenticated users - catalogue requires login)
// Optional query params:
//   category_id   filter by category id
//   business_id   filter by advertising business id
//   q             search by product name or description
//   status        default ACTIVE
const getAll = async (req, res) => {
    try {
        const {
            category_id,
            business_id,
            q,
            status = "ACTIVE"
        } = req.query;

        const conditions = [];
        const params = [];

        conditions.push("p.status = ?");
        params.push(status);
        conditions.push("b.verification_status = 'APPROVED'");

        if (category_id) {
            conditions.push("p.category_id = ?");
            params.push(category_id);
        }

        if (business_id) {
            conditions.push("p.business_id = ?");
            params.push(business_id);
        }

        if (q) {
            conditions.push(
                "(p.name LIKE ? OR p.description LIKE ?)"
            );
            params.push(`%${q}%`, `%${q}%`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const query = `
            SELECT p.id, p.business_id, p.category_id, p.name,
                   p.description, p.price, p.image, p.status,
                   p.created_at,
                   c.name AS category_name,
                   b.name AS business_name,
                   b.logo AS business_logo,
                   b.cover_image AS business_cover_image,
                   b.location AS business_location,
                   b.verification_status AS business_verification_status
            FROM products p
            JOIN businesses b ON b.id = p.business_id
            LEFT JOIN categories c ON c.id = p.category_id
            ${whereClause}
            ORDER BY b.name, p.name
            LIMIT 100
        `;

        const [products] = await db.query(query, params);

        return res.json({ success: true, data: products });
    } catch (error) {
        console.error("Error fetching products:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};


// GET /api/products/:id  (authenticated users)
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        const [products] = await db.query(
            `SELECT p.id, p.business_id, p.category_id, p.name,
                    p.description, p.price, p.image, p.status,
                    p.created_at,
                    c.name AS category_name,
                    b.name AS business_name,
                    b.description AS business_description,
                    b.logo AS business_logo,
                    b.cover_image AS business_cover_image,
                    b.phone AS business_phone,
                    b.email AS business_email,
                    b.location AS business_location,
                    b.operating_hours AS business_operating_hours,
                    b.verification_status AS business_verification_status
             FROM products p
             JOIN businesses b ON b.id = p.business_id
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.id = ?
               AND p.status = 'ACTIVE'
               AND b.verification_status = 'APPROVED'`,
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.json({ success: true, data: products[0] });
    } catch (error) {
        console.error("Error fetching product:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};


module.exports = {
    getAll,
    getById
};