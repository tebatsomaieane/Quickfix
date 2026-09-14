const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

pool.on("connection", (connection) => {
    connection.on("error", (err) => {
        if (err.code === "PROTOCOL_CONNECTION_LOST" ||
            err.code === "ECONNRESET") {
            console.error("Database connection lost:", err.code);
        } else {
            console.error("Unexpected database connection error:", err);
        }
    });
});

pool.on("error", (err) => {
    console.error("Unexpected database pool error:", err.message);
});

module.exports = pool;