const db = require("../config/db");


// GET /api/services
// Optional query params:
//   category_id   filter by category id
//   category      filter by category name
//   q             search by service name
//   status        default ACTIVE
const getAll = async (req, res) => {
    try {
        const {
            category_id,
            category,
            q,
            status = "ACTIVE"
        } = req.query;

        const conditions = [];
        const params = [];

        conditions.push("s.status = ?");
        params.push(status);

        if (category_id) {
            conditions.push("s.category_id = ?");
            params.push(category_id);
        }

        if (category) {
            conditions.push("c.name = ?");
            params.push(category);
        }

        if (q) {
            conditions.push("s.name LIKE ?");
            params.push(`%${q}%`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const query = `
            SELECT s.id, s.category_id, s.name, s.description,
                   s.image, s.status, s.created_at,
                   c.name AS category_name
            FROM services s
            JOIN categories c ON c.id = s.category_id
            ${whereClause}
            ORDER BY c.name, s.name
        `;

        const [services] = await db.query(query, params);

        res.json({ success: true, data: services });
    } catch (error) {
        console.error("Error fetching services:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch services"
        });
    }
};


// GET /api/services/:id
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid service id"
            });
        }

        const [services] = await db.query(
            `SELECT s.id, s.category_id, s.name, s.description,
                    s.image, s.status, s.created_at,
                    c.name AS category_name
             FROM services s
             JOIN categories c ON c.id = s.category_id
             WHERE s.id = ? AND s.status = 'ACTIVE'`,
            [id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        res.json({ success: true, data: services[0] });
    } catch (error) {
        console.error("Error fetching service:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch service"
        });
    }
};


module.exports = {
    getAll,
    getById
};