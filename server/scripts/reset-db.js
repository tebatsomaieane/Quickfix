// One-off: wipe the quickfix database and re-seed it from schema.sql +
// seed.sql (single admin + service catalogue, zero mock data/images).
//
// Usage:
//   railway connect mysql --tunnel-only -P <local-port>
//   DB_HOST=127.0.0.1 DB_PORT=<local-port> DB_USER=root DB_PASSWORD=<pw> \
//       DB_NAME=quickfix node server/scripts/reset-db.js

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");

const dbDir = path.resolve(__dirname, "..", "..", "database");
const schemaPath = path.join(dbDir, "schema.sql");
const seedPath = path.join(dbDir, "seed.sql");

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "quickfix",
    multipleStatements: true
});

const schema = fs.readFileSync(schemaPath, "utf8");
const seed = fs.readFileSync(seedPath, "utf8");

connection.connect((err) => {
    if (err) {
        console.error("CONNECT FAILED:", err.message);
        process.exit(1);
    }

    console.log("Resetting schema…");
    connection.query(schema, (schemaErr) => {
        if (schemaErr) {
            console.error("SCHEMA FAILED:", schemaErr.message);
            process.exit(1);
        }

        console.log("Seeding…");
        connection.query(seed, (seedErr) => {
            if (seedErr) {
                console.error("SEED FAILED:", seedErr.message);
                process.exit(1);
            }

            const tables = [
                "users", "categories", "services",
                "provider_profiles", "customer_profiles",
                "service_requests", "jobs", "businesses",
                "products", "advertisements", "promotions"
            ];

            const counts = {};
            let remaining = tables.length;

            tables.forEach((table) => {
                connection.query(
                    `SELECT COUNT(*) AS n FROM \`${table}\``,
                    (countErr, rows) => {
                        if (!countErr) counts[table] = rows[0].n;
                        remaining -= 1;
                        if (remaining === 0) {
                            console.log("Row counts:", JSON.stringify(counts));
                            console.log("Image rows:",
                                JSON.stringify({
                                    categoriesWithImages: counts.categories,
                                    servicesWithImages: counts.services
                                }));
                            connection.end();
                            console.log("DONE");
                        }
                    }
                );
            });
        });
    });
});