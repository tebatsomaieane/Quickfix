// PM2 process configuration for the QuickFix API server.
// ---------------------------------------------------------------------
// Start:      pm2 start ecosystem.config.js --env production
// Status:     pm2 status
// Logs:       pm2 logs quickfix-server
// Restart:    pm2 restart quickfix-server
// ---------------------------------------------------------------------
module.exports = {
    apps: [
        {
            name: "quickfix-server",
            script: "server.js",
            cwd: __dirname,
            instances: "max",
            exec_mode: "cluster",
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