const db = require("../config/db");


const PROVIDER_BASE_SELECT = `
    SELECT pp.id, pp.user_id, pp.description, pp.profile_image,
           pp.experience_years, pp.location, pp.service_area,
           pp.verification_status,
           u.first_name, u.last_name, u.email, u.phone,
           (SELECT ROUND(AVG(r.rating), 1)
            FROM reviews r
            WHERE r.provider_id = pp.id) AS rating,
           (SELECT COUNT(*)
            FROM reviews r
            WHERE r.provider_id = pp.id) AS review_count,
           (SELECT COUNT(*)
            FROM jobs j
            WHERE j.provider_id = pp.id
              AND j.status = 'COMPLETED') AS completed_jobs
    FROM provider_profiles pp
    JOIN users u ON u.id = pp.user_id
`;


// GET /api/providers
// Optional query params:
//   q             search by name, description or service
//   service_id    filter by provider service
//   category_id   filter by category of provider services
//   verified      'true' to only show APPROVED providers
const getAll = async (req, res) => {
    try {
        const {
            q,
            service_id,
            category_id,
            verified
        } = req.query;

        const conditions = ["u.is_active = TRUE"];
        const params = [];

        if (q) {
            conditions.push(`(
                u.first_name LIKE ? OR
                u.last_name LIKE ? OR
                CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR
                pp.description LIKE ? OR
                EXISTS (
                    SELECT 1
                    FROM provider_services ps2
                    JOIN services s2 ON s2.id = ps2.service_id
                    WHERE ps2.provider_id = pp.id
                      AND s2.name LIKE ?
                )
            )`);

            const search = `%${q}%`;
            params.push(search, search, search, search, search);
        }

        if (verified === "true") {
            conditions.push("pp.verification_status = 'APPROVED'");
        }

        if (service_id) {
            conditions.push("EXISTS (SELECT 1 FROM provider_services ps WHERE ps.provider_id = pp.id AND ps.service_id = ?)");
            params.push(service_id);
        }

        if (category_id) {
            conditions.push(`EXISTS (
                SELECT 1
                FROM provider_services ps
                JOIN services s ON s.id = ps.service_id
                WHERE ps.provider_id = pp.id
                  AND s.category_id = ?
            )`);
            params.push(category_id);
        }

        const query = `
            ${PROVIDER_BASE_SELECT}
            WHERE ${conditions.join(" AND ")}
            ORDER BY u.first_name
            LIMIT 100
        `;

        const [providers] = await db.query(query, params);

        // Strip PII from public listing
        const safeProviders = providers.map((p) => {
            const { email, phone, ...rest } = p;
            return rest;
        });

        if (safeProviders.length > 0) {
            // Batch-fetch every provider's services in ONE query instead of
            // running a query per provider (avoids N+1).
            const ids = safeProviders.map((p) => p.id);
            const [services] = await db.query(
                `SELECT ps.provider_id, s.id, s.name, s.category_id,
                        c.name AS category_name, ps.price
                 FROM provider_services ps
                 JOIN services s ON s.id = ps.service_id
                 JOIN categories c ON c.id = s.category_id
                 WHERE ps.provider_id IN (?)
                 ORDER BY c.name, s.name`,
                [ids]
            );

            const servicesByProvider = new Map();
            for (const service of services) {
                if (!servicesByProvider.has(service.provider_id)) {
                    servicesByProvider.set(service.provider_id, []);
                }
                servicesByProvider.get(service.provider_id).push(service);
            }

            for (const provider of safeProviders) {
                provider.services = servicesByProvider.get(provider.id) || [];
            }
        }

        res.json({ success: true, data: safeProviders });
    } catch (error) {
        console.error("Error fetching providers:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch providers"
        });
    }
};


// Loads a full provider payload (profile, services, availability, reviews).
const loadProviderById = async (providerId) => {
    const [providers] = await db.query(
        `${PROVIDER_BASE_SELECT}
         WHERE pp.id = ?`,
        [providerId]
    );

    if (providers.length === 0) {
        return null;
    }

    const provider = providers[0];

    const [services] = await db.query(
        `SELECT s.id, s.name, s.category_id, c.name AS category_name,
                ps.price
         FROM provider_services ps
         JOIN services s ON s.id = ps.service_id
         JOIN categories c ON c.id = s.category_id
         WHERE ps.provider_id = ?
         ORDER BY c.name, s.name`,
        [providerId]
    );

    const [availability] = await db.query(
        `SELECT day_of_week, start_time, end_time, is_available
         FROM provider_availability
         WHERE provider_id = ?
         ORDER BY FIELD(day_of_week,
             'MONDAY','TUESDAY','WEDNESDAY',
             'THURSDAY','FRIDAY','SATURDAY','SUNDAY')`,
        [providerId]
    );

    const [reviews] = await db.query(
        `SELECT r.id, r.rating, r.comment, r.provider_response,
                r.provider_response_at, r.created_at,
                cu.first_name, cu.last_name
         FROM reviews r
         JOIN customer_profiles cp ON cp.id = r.customer_id
         JOIN users cu ON cu.id = cp.user_id
         WHERE r.provider_id = ?
         ORDER BY r.created_at DESC`,
        [providerId]
    );

    provider.services = services;
    provider.availability = availability;
    provider.reviews = reviews;

    return provider;
};


// Strip PII unless the requester is the provider themselves.
const stripProviderPii = (provider, req) => {
    const isOwner = !!(req.user && req.user.id === provider.user_id);

    if (!isOwner) {
        delete provider.email;
        delete provider.phone;
    }

    return provider;
};


// GET /api/providers/:id
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid provider id"
            });
        }

        const provider = await loadProviderById(id);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: "Provider not found"
            });
        }

        stripProviderPii(provider, req);

        res.json({ success: true, data: provider });
    } catch (error) {
        console.error("Error fetching provider:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch provider"
        });
    }
};


// GET /api/providers/me  (PROVIDER - own profile)
const me = async (req, res) => {
    try {
        const [profiles] = await db.query(
            `SELECT pp.id
             FROM provider_profiles pp
             WHERE pp.user_id = ?`,
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Provider profile not found"
            });
        }

        const provider = await loadProviderById(profiles[0].id);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: "Provider profile not found"
            });
        }

        // Owner always sees their own PII (already present from the base select).
        provider.user_id = req.user.id;

        return res.json({ success: true, data: provider });
    } catch (error) {
        console.error("Error fetching own provider profile:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch provider profile"
        });
    }
};


// PATCH /api/providers/me  (PROVIDER - update own profile)
const updateMe = async (req, res) => {
    try {
        const [profiles] = await db.query(
            "SELECT id FROM provider_profiles WHERE user_id = ?",
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Provider profile not found"
            });
        }

        const providerId = profiles[0].id;
        const {
            description,
            profile_image,
            experience_years,
            location,
            service_area
        } = req.body;

        const fields = {};
        if (description !== undefined) fields.description = String(description).trim();
        if (profile_image !== undefined) fields.profile_image = String(profile_image).trim() || null;
        if (experience_years !== undefined) {
            const years = Number(experience_years);

            if (!Number.isFinite(years) || years < 0 || !Number.isInteger(years)) {
                return res.status(400).json({
                    success: false,
                    message: "Experience years must be a non-negative whole number"
                });
            }

            fields.experience_years = years;
        }
        if (location !== undefined) fields.location = String(location).trim() || null;
        if (service_area !== undefined) fields.service_area = String(service_area).trim() || null;

        if (Object.keys(fields).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Nothing to update"
            });
        }

        await db.query(
            `UPDATE provider_profiles SET
                description = COALESCE(?, description),
                profile_image = COALESCE(?, profile_image),
                experience_years = COALESCE(?, experience_years),
                location = COALESCE(?, location),
                service_area = COALESCE(?, service_area)
             WHERE id = ?`,
            [
                fields.description ?? null,
                fields.profile_image ?? null,
                fields.experience_years ?? null,
                fields.location ?? null,
                fields.service_area ?? null,
                providerId
            ]
        );

        const [updated] = await db.query(
            `SELECT pp.id, pp.user_id, pp.description, pp.profile_image,
                    pp.experience_years, pp.location, pp.service_area,
                    pp.verification_status, pp.created_at, pp.updated_at,
                    u.first_name, u.last_name, u.email, u.phone
             FROM provider_profiles pp
             JOIN users u ON u.id = pp.user_id
             WHERE pp.id = ?`,
            [providerId]
        );

        return res.json({
            success: true,
            message: "Provider profile updated",
            data: updated[0]
        });
    } catch (error) {
        console.error("Error updating provider profile:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update provider profile"
        });
    }
};


// PUT /api/providers/me/services  (PROVIDER)
// Body: { services: [{ service_id, price }] }
// Replaces the full list of services the provider offers.
const updateMyServices = async (req, res) => {
    try {
        const [profiles] = await db.query(
            "SELECT id FROM provider_profiles WHERE user_id = ?",
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Provider profile not found"
            });
        }

        const providerId = profiles[0].id;
        const { services } = req.body;

        if (!Array.isArray(services)) {
            return res.status(400).json({
                success: false,
                message: "services must be an array of { service_id, price }"
            });
        }

        const normalized = [];
        const seenServiceIds = new Set();

        for (const entry of services) {
            const serviceId = Number(entry.service_id);
            if (!Number.isInteger(serviceId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid service_id in services list"
                });
            }

            if (seenServiceIds.has(serviceId)) {
                return res.status(400).json({
                    success: false,
                    message: `Duplicate service_id ${serviceId} in services list`
                });
            }

            seenServiceIds.add(serviceId);

            const price = entry.price !== undefined && entry.price !== null && entry.price !== ""
                ? Number(entry.price)
                : null;

            if (price !== null && (!Number.isFinite(price) || price < 0)) {
                return res.status(400).json({
                    success: false,
                    message: "Price must be a positive number or empty"
                });
            }

            normalized.push({ service_id: serviceId, price });
        }

        // Verify all service ids exist and are active
        for (const entry of normalized) {
            const [rows] = await db.query(
                "SELECT id FROM services WHERE id = ? AND status = 'ACTIVE'",
                [entry.service_id]
            );
            if (rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Service ${entry.service_id} does not exist or is inactive`
                });
            }
        }

        // Replace the full service list atomically
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            await connection.query("DELETE FROM provider_services WHERE provider_id = ?", [providerId]);

            for (const entry of normalized) {
                await connection.query(
                    `INSERT INTO provider_services (provider_id, service_id, price)
                     VALUES (?, ?, ?)`,
                    [providerId, entry.service_id, entry.price]
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();

            throw error;
        } finally {
            connection.release();
        }

        const [servicesList] = await db.query(
            `SELECT s.id, s.name, s.category_id, c.name AS category_name,
                    ps.price
             FROM provider_services ps
             JOIN services s ON s.id = ps.service_id
             JOIN categories c ON c.id = s.category_id
             WHERE ps.provider_id = ?
             ORDER BY c.name, s.name`,
            [providerId]
        );

        return res.json({
            success: true,
            message: "Provider services updated",
            data: servicesList
        });
    } catch (error) {
        console.error("Error updating provider services:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update provider services"
        });
    }
};


// PUT /api/providers/me/availability  (PROVIDER)
// Body: { availability: [{ day_of_week, start_time, end_time, is_available }] }
const updateMyAvailability = async (req, res) => {
    try {
        const [profiles] = await db.query(
            "SELECT id FROM provider_profiles WHERE user_id = ?",
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Provider profile not found"
            });
        }

        const providerId = profiles[0].id;
        const { availability } = req.body;

        if (!Array.isArray(availability)) {
            return res.status(400).json({
                success: false,
                message: "availability must be an array of day entries"
            });
        }

        const validDays = [
            "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
            "FRIDAY", "SATURDAY", "SUNDAY"
        ];

        const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

        const seenDays = new Set();

        for (const entry of availability) {
            if (!validDays.includes(entry.day_of_week)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid day_of_week: ${entry.day_of_week}`
                });
            }

            if (seenDays.has(entry.day_of_week)) {
                return res.status(400).json({
                    success: false,
                    message: `Duplicate entry for ${entry.day_of_week}`
                });
            }

            seenDays.add(entry.day_of_week);

            if (
                entry.start_time !== null &&
                entry.start_time !== undefined &&
                !TIME_RE.test(String(entry.start_time))
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid start_time, expected HH:MM (24-hour)"
                });
            }

            if (
                entry.end_time !== null &&
                entry.end_time !== undefined &&
                !TIME_RE.test(String(entry.end_time))
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid end_time, expected HH:MM (24-hour)"
                });
            }
        }

        // Replace the full availability list atomically
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            await connection.query(
                "DELETE FROM provider_availability WHERE provider_id = ?",
                [providerId]
            );

            for (const entry of availability) {
                const isAvailable = entry.is_available !== false;
                const start = entry.start_time || "00:00";
                const end = entry.end_time || "00:00";

                await connection.query(
                    `INSERT INTO provider_availability
                        (provider_id, day_of_week, start_time, end_time, is_available)
                     VALUES (?, ?, ?, ?, ?)`,
                    [providerId, entry.day_of_week, start, end, isAvailable]
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();

            throw error;
        } finally {
            connection.release();
        }

        const [avail] = await db.query(
            `SELECT day_of_week, start_time, end_time, is_available
             FROM provider_availability
             WHERE provider_id = ?
             ORDER BY FIELD(day_of_week,
                 'MONDAY','TUESDAY','WEDNESDAY',
                 'THURSDAY','FRIDAY','SATURDAY','SUNDAY')`,
            [providerId]
        );

        return res.json({
            success: true,
            message: "Provider availability updated",
            data: avail
        });
    } catch (error) {
        console.error("Error updating provider availability:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update provider availability"
        });
    }
};


module.exports = {
    getAll,
    getById,
    me,
    updateMe,
    updateMyServices,
    updateMyAvailability
};