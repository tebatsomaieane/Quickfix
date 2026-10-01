const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
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
const uploadRoutes = require("./routes/uploadRoutes");
const csrfRoutes = require("./routes/csrfRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const { csrfProtection } = require("./middleware/csrf");

const app = express();

// Trust one level of reverse-proxy termination (nginx/ALB). Required so
// req.ip reflects the real client behind the proxy, keeping rate limiting
// and IP logging accurate.
app.set("trust proxy", 1);

app.disable("x-powered-by");

// Origins the browser is allowed to load subresources from and talk to.
// `API_ORIGIN` is the API's own public address (it serves user uploads from
// /uploads, so media has to be allowed from it too). Both are env-driven so a
// staging host does not silently fall back to production.
const apiOrigin = (process.env.API_ORIGIN || "").replace(/\/+$/, "");
const publicOrigin = (process.env.PUBLIC_ORIGIN || "").replace(/\/+$/, "");

const mediaOrigins = [apiOrigin, publicOrigin].filter(Boolean);

const cspDirectives = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    // The build ships no inline <script>, so this needs no escape hatch. This is
    // the directive that actually stops an injected script from executing.
    scriptSrc: ["'self'"],
    // React writes `style="..."` for dynamic values (progress widths, carousel
    // offsets), and index.html carries a small critical-CSS block, so inline
    // styles have to be permitted. Scripts are what matter for XSS.
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://thumb.wikimedia.org",
        ...mediaOrigins
    ],
    // User-uploaded photos and videos are served by the API.
    mediaSrc: ["'self'", "blob:", ...mediaOrigins],
    // API calls and SSE streams.
    connectSrc: ["'self'", ...mediaOrigins],
    manifestSrc: ["'self'"],
    workerSrc: ["'self'", "blob:"],
    formAction: ["'self'"],
    // The app is never legitimately framed.
    frameAncestors: ["'none'"]
};

// Plain HTTP is only upgraded in production; doing it in development would
// break the local http://localhost setup.
if (process.env.NODE_ENV === "production") {
    cspDirectives.upgradeInsecureRequests = [];
}

// Security headers (helmet replaces the manual headers below it)
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: {
            useDefaults: false,
            directives: cspDirectives
        }
    })
);

// Attach a request id for correlating logs and error reports. This has to run
// before the logger below so every line carries the same id the error responses
// and the `X-Request-Id` header do -- which is the only way to trace one user's
// reported problem back through the log.
app.use((req, res, next) => {
    req.id = crypto.randomBytes(8).toString("hex");
    res.setHeader("X-Request-Id", req.id);
    next();
});

// Request logging (skip in test environments)
if (process.env.NODE_ENV !== "test") {
    app.use(
        morgan(process.env.LOG_FORMAT || ":id :method :url :status :res[content-length] - :response-time ms")
    );
}

// Response compression.
//
// Every JSON list this API returns is text and compresses to roughly a fifth of
// its size, so this is the single biggest response-time win available for a
// catalogue or messages list. It is placed after `helmet` and before the route
// handlers so it can choose an encoding from the response's own `Content-Type`.
//
// `threshold` skips payloads too small to be worth compressing -- most single
// object responses are under 1kB, and compressing those costs CPU and adds
// latency for nothing. Images, video and already-compressed formats are left
// alone by the default filter.
app.use(
    compression({
        threshold: 1024,
        // Client-side support is negotiated per request; gzip is the safe floor
        // because every browser that can run this app offers it.
        level: 6,
        // Server-sent events must never be compressed. `text/event-stream` is
        // technically "compressible", and compressing it buffers the whole
        // response -- which would turn the live notification stream into one
        // long delay followed by a burst, defeating the entire point of it.
        filter(req, res) {
            if (res.getHeader("Content-Type") === "text/event-stream") {
                return false;
            }

            return compression.filter(req, res);
        }
    })
);

// Security headers
app.use((req, res, next) => {
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    if (process.env.NODE_ENV === "production") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();
});

// CORS — CLIENT_ORIGIN may be a single origin or a comma-separated list.
// A leading "*." entry is treated as a wildcard suffix (any subdomain), e.g.
// "https://*.vercel.app" so Vercel preview deployments are allowed too.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

// Exact match, or a "https://*.vercel.app" style wildcard (any FQDN directly
// under the wildcard host). Blocked so that another TLD sharing the suffix
// (e.g. evilvercel.app) is NOT accepted.
const originMatches = (pattern, origin) => {
    if (pattern === origin) return true;
    const wildcard = pattern.indexOf("*.");
    if (wildcard === -1) return false;
    const wildcardHost = pattern.slice(wildcard + 2);
    try {
        return new URL(origin).hostname.endsWith(`.${wildcardHost}`);
    } catch {
        return false;
    }
};

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
            if (
                !requestOrigin ||
                allowedOrigins.some((pattern) => originMatches(pattern, requestOrigin))
            ) {
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

// CSRF defence (mutating requests must echo the csrfToken cookie).
app.use(csrfProtection);

// User-uploaded media (photos/videos) stored on the API server's disk.
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir, {
    dotfiles: "deny",
    index: false,
    maxAge: "7d"
}));

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

// Security token endpoint (CSRF bootstrap)
app.use("/api/csrf", csrfRoutes);

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

// Media uploads
app.use("/api/uploads", uploadRoutes);

// Real-time events (SSE)
app.use("/api/events", eventsRoutes);

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