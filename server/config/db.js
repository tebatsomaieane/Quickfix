const mysql = require("mysql2/promise");
const { applyQueryTimeout } = require("../utils/queryTimeout");
require("dotenv").config();

const QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS) || 15000;

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    // 0 would park every waiting request in memory until a connection frees,
    // and the response time then tracks backlog rather than the query. Bounding
    // the queue makes the pressure visible as an immediate error the client can
    // retry, instead of a slow site nobody can explain.
    queueLimit: Number(process.env.DB_QUEUE_LIMIT) || 200,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// A query that has not answered in this long is almost certainly a lock wait
// rather than a slow query, and holding the connection open only makes the
// backlog worse. mysql2 only honours `timeout` per query, so it is applied here
// to every query/execute on the pool and on the connections getConnection hands
// out -- a pool-level `timeout` would be silently ignored.
applyQueryTimeout(pool, QUERY_TIMEOUT_MS);

const acquireConnection = pool.getConnection.bind(pool);

pool.getConnection = async (...args) =>
    applyQueryTimeout(await acquireConnection(...args), QUERY_TIMEOUT_MS);

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