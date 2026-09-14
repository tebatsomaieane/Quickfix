const db = require("../config/db");


// GET /api/categories
// Optional query: ?with=services
const getAll = async (req, res) => {
    try {
        const { with: withParam } = req.query;

        let query = `
            SELECT c.id, c.name, c.description, c.image, c.status,
                   (SELECT COUNT(*)
                    FROM services s
                    WHERE s.category_id = c.id
                      AND s.status = 'ACTIVE') AS service_count
            FROM categories c
            WHERE c.status = 'ACTIVE'
            ORDER BY c.name
        `;

        const [categories] = await db.query(query);

        if (withParam === "services") {
            const [services] = await db.query(
                `SELECT id, category_id, name, description, image, status
                 FROM services
                 WHERE status = 'ACTIVE'
                 ORDER BY name`
            );

            const servicesByCategory = {};

            services.forEach((service) => {
                if (!servicesByCategory[service.category_id]) {
                    servicesByCategory[service.category_id] = [];
                }

                servicesByCategory[service.category_id].push(service);
            });

            categories.forEach((category) => {
                category.services = servicesByCategory[category.id] || [];
            });
        }

        res.json({ success: true, data: categories });
    } catch (error) {
        console.error("Error fetching categories:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch categories"
        });
    }
};


// GET /api/categories/:id
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid category id"
            });
        }

        const [categories] = await db.query(
            `SELECT id, name, description, image, status
             FROM categories
             WHERE id = ? AND status = 'ACTIVE'`,
            [id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const category = categories[0];

        const [services] = await db.query(
            `SELECT id, category_id, name, description, image, status
             FROM services
             WHERE category_id = ? AND status = 'ACTIVE'
             ORDER BY name`,
            [id]
        );

        category.services = services;

        res.json({ success: true, data: category });
    } catch (error) {
        console.error("Error fetching category:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch category"
        });
    }
};


module.exports = {
    getAll,
    getById
};