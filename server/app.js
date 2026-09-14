const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const crypto = require("crypto");
const path = require("path");

const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const providerRoutes = require("./routes/providerRoutes");
const providerRequestRoutes = require("./routes/providerRequestRoutes");
const requestRoutes = require("./routes/requestRoutes");
const offerRoutes = require("./routes/offerRoutes");
const jobRoutes = require("./routes/jobRoutes");
const productRoutes = require("./routes/productRoutes");
const marketRoutes = require("./routes/marketRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const businessRoutes = require("./routes/businessRoutes");
const providerVerificationRoutes = require("./routes/providerVerificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Trust one level of reverse-proxy termination (nginx/ALB). Required so
// req.ip reflects the real client behind the proxy, keeping rate limiting
// and IP logging accurate.
app.set("trust proxy", 1);

app.disable("x-powered-by");

// Security headers (helmet replaces the manual headers below it)
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

// Request logging (skip in test environments)
if (process.env.NODE_ENV !== "test") {
    app.use(morgan(process.env.LOG_FORMAT || "combined"));
}

// Attach a request id for correlating logs and error reports.
app.use((req, res, next) => {
    req.id = crypto.randomBytes(8).toString("hex");
    res.setHeader("X-Request-Id", req.id);
    next();
});

// Security headers
app.use((req, res, next) => {
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    if (process.env.NODE_ENV === "production") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();
});

// CORS — CLIENT_ORIGIN may be a single origin or a comma-separated list.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

// Same-origin requests (the built app served by this API) need no CORS
// headers, so they skip the middleware entirely. Cross-origin requests are
// checked against the allowlist below.
app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && req.headers.host) {
        let sameOrigin = false;
        try {
            sameOrigin = new URL(origin).host === req.headers.host;
        } catch {
            /* malformed Origin header - fall through to CORS check */
        }
        if (sameOrigin) {
            return next();
        }
    }

    return cors({
        origin(requestOrigin, callback) {
            if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true
    })(req, res, next);
});
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// Home route (development only - in production the built client is served)
if (process.env.NODE_ENV !== "production") {
    app.get("/", (req, res) => {
        res.json({
            success: true,
            name: "QuickFix API",
            docs: "/api/health",
            uptime: process.uptime()
        });
    });
}

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "ok",
        time: new Date().toISOString()
    });
});

// Test routes (development only)
if (process.env.NODE_ENV !== "production") {
    app.use("/api/test", testRoutes);
}

// Authentication routes
app.use("/api/auth", authRoutes);

// Service catalogue routes (public)
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);

// Provider directory routes
app.use("/api/providers", providerRoutes);

// Provider-facing request routes (open requests + own offer)
app.use("/api/provider/requests", providerRequestRoutes);

// Service request routes (customer)
app.use("/api/requests", requestRoutes);

// Offer routes
app.use("/api/offers", offerRoutes);

// Job routes
app.use("/api/jobs", jobRoutes);

// Product catalogue routes (public)
app.use("/api/products", productRoutes);

// Marketplace overview routes
app.use("/api/market", marketRoutes);

// Messaging routes
app.use("/api/conversations", conversationRoutes);

// Notifications routes
app.use("/api/notifications", notificationRoutes);

// Reviews routes
app.use("/api/reviews", reviewRoutes);

// Complaints routes
app.use("/api/complaints", complaintRoutes);

// Business routes
app.use("/api/business", businessRoutes);

// Provider verification routes
app.use("/api/provider/verification", providerVerificationRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// Production single-process deployment: serve the built React client.
if (process.env.NODE_ENV === "production") {
    const clientDist = path.join(__dirname, "..", "client", "dist");
    const indexPath = path.join(clientDist, "index.html");

    app.use(express.static(clientDist, {
        index: false,
        maxAge: "1y",
        immutable: true
    }));

    // SPA fallback - send index.html for any non-API, non-file GET request.
    app.use((req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        if (req.path === "/api" || req.path.startsWith("/api/")) return next();
        return res.sendFile(indexPath, (err) => {
            if (err) next(err);
        });
    });
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        requestId: req.id
    });
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error(`[${req.id || "-"}] Unhandled error:`, err);

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "Origin not allowed by CORS",
            requestId: req.id
        });
    }

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON body",
            requestId: req.id
        });
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request body too large",
            requestId: req.id
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal server error",
        requestId: req.id
    });
});

module.exports = app;