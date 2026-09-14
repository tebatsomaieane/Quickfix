const db = require("../config/db");


// GET /api/market/summary  (authenticated users)
// Lightweight overview counts for dashboards.
const summary = async (req, res) => {
    try {
        const [
            [services],
            [products],
            [providers],
            [businesses],
            [categories]
        ] = await Promise.all([
            db.query(
                "SELECT COUNT(*) AS total FROM services WHERE status = 'ACTIVE'"
            ),
            db.query(
                "SELECT COUNT(*) AS total FROM products WHERE status = 'ACTIVE'"
            ),
            db.query(
                "SELECT COUNT(*) AS total FROM provider_profiles WHERE verification_status = 'APPROVED'"
            ),
            db.query(
                "SELECT COUNT(*) AS total FROM businesses WHERE verification_status = 'APPROVED'"
            ),
            db.query(
                "SELECT COUNT(*) AS total FROM categories WHERE status = 'ACTIVE'"
            )
        ]);

        return res.json({
            success: true,
            data: {
                services: services[0].total,
                products: products[0].total,
                providers: providers[0].total,
                businesses: businesses[0].total,
                categories: categories[0].total
            }
        });
    } catch (error) {
        console.error("Error fetching market summary:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch market summary"
        });
    }
};


// GET /api/market/promotions  (public)
// Active promotions on today's date; only approved/verified businesses.
const activePromotions = async (req, res) => {
    try {
        const [promotions] = await db.query(
            `SELECT p.id, p.title, p.description, p.discount,
                    p.start_date, p.end_date, p.status,
                    b.id AS business_id, b.name AS business_name,
                    b.location AS business_location
             FROM promotions p
             JOIN businesses b ON b.id = p.business_id
             WHERE p.status = 'ACTIVE'
               AND b.verification_status = 'APPROVED'
               AND p.start_date <= CURDATE()
               AND p.end_date >= CURDATE()
             ORDER BY p.start_date DESC
             LIMIT 50`
        );

        return res.json({ success: true, data: promotions });
    } catch (error) {
        console.error("Error fetching active promotions:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load promotions"
        });
    }
};


// GET /api/market/advertisements  (public)
const activeAdvertisements = async (req, res) => {
    try {
        const [ads] = await db.query(
            `SELECT a.id, a.title, a.description, a.image,
                    a.start_date, a.end_date, a.status,
                    b.id AS business_id, b.name AS business_name,
                    b.location AS business_location
             FROM advertisements a
             JOIN businesses b ON b.id = a.business_id
             WHERE a.status = 'ACTIVE'
               AND b.verification_status = 'APPROVED'
               AND a.start_date <= CURDATE()
               AND a.end_date >= CURDATE()
             ORDER BY a.start_date DESC
             LIMIT 50`
        );

        return res.json({ success: true, data: ads });
    } catch (error) {
        console.error("Error fetching active advertisements:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load advertisements"
        });
    }
};


// GET /api/market/overview  (public)
// Trust signals for the public landing page, computed from live data.
const overview = async (req, res) => {
    try {
        const [
            [providers],
            [jobs],
            [rating],
            [categories]
        ] = await Promise.all([
            db.query(
                "SELECT COUNT(*) AS total FROM provider_profiles WHERE verification_status = 'APPROVED'"
            ),
            db.query(
                "SELECT COUNT(*) AS total FROM jobs WHERE status = 'COMPLETED'"
            ),
            db.query(
                "SELECT ROUND(AVG(rating), 1) AS rating FROM reviews"
            ),
            db.query(
                "SELECT COUNT(*) AS total FROM categories WHERE status = 'ACTIVE'"
            )
        ]);

        return res.json({
            success: true,
            data: {
                verifiedProviders: providers[0].total,
                completedJobs: jobs[0].total,
                avgRating: rating[0].rating,
                categories: categories[0].total
            }
        });
    } catch (error) {
        console.error("Error fetching market overview:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch market overview"
        });
    }
};


module.exports = {
    summary,
    overview,
    activePromotions,
    activeAdvertisements
};
