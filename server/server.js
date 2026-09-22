require("dotenv").config();

const app = require("./app");
const db = require("./config/db");
const ensureSchema = require("./utils/ensureSchema");
const { startScheduler } = require("./utils/stateScheduler");
const { startUploadCleanup } = require("./utils/cleanupUploads");

const PORT = process.env.PORT || 5000;

// Fail fast if required secrets are missing or still placeholders.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("JWT_SECRET is not set. Set it in the .env file.");
    process.exit(1);
}

if (JWT_SECRET.length < 32 || JWT_SECRET.includes("change_this")) {
    console.error(
        "JWT_SECRET is too weak. Generate a strong one with:\n" +
        "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
    process.exit(1);
}

// Surface unhandled promise rejections instead of silently dying.
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
});

async function startServer() {
    try {
        const connection = await db.getConnection();

        console.log("MySQL connected successfully");

        connection.release();

        await ensureSchema();

        startUploadCleanup();

        // Expire stale offers/ads/promotions and close abandoned requests.
        startScheduler(
            Number(process.env.SCHEDULER_INTERVAL_MINUTES) || 15
        );

        const server = app.listen(PORT, () => {
            console.log(`QuickFix server running on http://localhost:${PORT}`);
        });

        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use.`);
            } else {
                console.error("Failed to start HTTP server:", error.message);
            }
            process.exit(1);
        });

        const shutdown = async (signal) => {
            console.log(`${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                try {
                    await db.end();
                    console.log("Database pool closed");
                } catch (error) {
                    console.error("Error closing database pool:", error.message);
                }

                process.exit(0);
            });

            setTimeout(() => {
                console.error("Forced shutdown after timeout");
                process.exit(1);
            }, 10000).unref();
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        console.error("MySQL connection failed:");
        console.error(error.message);

        process.exit(1);
    }
}

startServer();