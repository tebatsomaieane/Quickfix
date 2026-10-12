// PM2 process configuration for the QuickFix API server.
// ---------------------------------------------------------------------
// Start:      pm2 start ecosystem.config.js --env production
// Status:     pm2 status
// Logs:       pm2 logs quickfix-server
// Restart:    pm2 restart quickfix-server
// ---------------------------------------------------------------------
// Runs a single fork-mode process on purpose. The rate limiter and the SSE
// realtime bus (utils/realtime.js) both keep their state in process memory, so
// PM2 cluster mode would give each worker its own counters and its own set of
// connected clients -- rate limits would multiply by the worker count and
// events would only reach clients that happened to land on the same worker.
// Scale horizontally only after moving that state to a shared store (Redis).
module.exports = {
    apps: [
        {
            name: "quickfix-server",
            script: "server.js",
            cwd: __dirname,
            instances: 1,
            exec_mode: "fork",
            max_memory_restart: "300M",
            env: {
                NODE_ENV: "development",
                PORT: 5000
            },
            env_production: {
                NODE_ENV: "production",
                PORT: 5000
            },
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            out_file: "./logs/out.log",
            error_file: "./logs/err.log",
            merge_logs: true,
            time: true
        }
    ]
};