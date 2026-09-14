const express = require("express");
const db = require("../config/db");

const router = express.Router();

// Only accessible in development
if (process.env.NODE_ENV === "production") {
    // Express 5 uses {*path} instead of bare "*"
    router.all("/{*path}", (req, res) => {
        res.status(404).json({ success: false, message: "Not found" });
    });
} else {
    // Database test
    router.get("/db", async (req, res) => {
        try {
            const [rows] = await db.query(
                "SELECT DATABASE() AS database_name"
            );

            res.json({
                success: true,
                message: "Database connection is working",
                database: rows[0].database_name
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Database connection failed"
            });
        }
    });
}


module.exports = router;