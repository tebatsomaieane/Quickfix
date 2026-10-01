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
    // Without a queue limit, a burst of traffic parks every waiting request in
    // memory until a connection frees, and the response time then tracks
    // backlog rather than the query. Bounding the queue makes the pressure
    // visible as an immediate error the client can retry, instead of a slow
    // site nobody can explain.
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
    // A query that has not answered in this long is almost certainly a lock
    // wait rather than a slow query, and holding the connection open only makes
    // the backlog worse.
    timeout: Number(process.env.DB_QUERY_TIMEOUT_MS) || 15000,
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