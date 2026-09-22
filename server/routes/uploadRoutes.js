const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { protect } = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const DAILY_QUOTA_BYTES =
    (Number(process.env.UPLOAD_DAILY_QUOTA_MB) || 250) * 1024 * 1024;

// Authenticated users only - media is owned by real accounts.
router.use(protect);

// Cap how many uploads a single account can push through in a window.
router.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 40 }));

const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ext && /^[a-z0-9.]{1,10}$/.test(ext) ? ext : "";
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExt}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: VIDEO_MAX_BYTES },
    fileFilter: (req, file, cb) => cb(null, true)
});

// Detect the real file type from magic bytes - never trust the client's
// declared MIME type (which is trivially spoofed, e.g. HTML/SVG/JS).
const sniffFile = (buffer) => {
    const b = buffer;

    if (b.length >= 8 &&
        b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 &&
        b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A) {
        return { kind: "image", mime: "image/png" };
    }

    if (b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) {
        return { kind: "image", mime: "image/jpeg" };
    }

    if (b.length >= 6 &&
        b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) {
        return { kind: "image", mime: "image/gif" };
    }

    if (b.length >= 12 &&
        b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
        b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
        return { kind: "image", mime: "image/webp" };
    }

    // ISO-BMFF (MP4 / QuickTime / M4V): box size + "ftyp"
    if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
        return { kind: "video", mime: "video/mp4" };
    }

    // Matroska container (WebM / MKV): 0x1A 45 DF A3
    if (b.length >= 4 && b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3) {
        return { kind: "video", mime: "video/webm" };
    }

    return null;
};

// Tracking uploaded allocation for the quota. In-memory and per-instance;
// acceptable for single-process deployments (like the rate limiter).
const dailyTotals = new Map();
const QUOTA_WINDOW = 24 * 60 * 60 * 1000;

const getQuota = (userId) => {
    const entry = dailyTotals.get(userId);

    if (!entry) return { bytes: 0 };

    if (Date.now() - entry.since > QUOTA_WINDOW) {
        dailyTotals.delete(userId);
        return { bytes: 0 };
    }

    return entry;
};

const addToQuota = (userId, bytes) => {
    const entry = getQuota(userId);
    entry.since = entry.since || Date.now();
    entry.bytes += bytes;
    dailyTotals.set(userId, entry);

    if (dailyTotals.size > 20000) {
        for (const [key, value] of dailyTotals) {
            if (Date.now() - value.since > QUOTA_WINDOW) {
                dailyTotals.delete(key);
            }
        }
    }
};

const buildPublicUrl = (req, filename) => {
    const base =
        process.env.PUBLIC_API_URL ||
        `${req.protocol}://${req.get("host")}`;

    return `${base.replace(/\/$/, "")}/uploads/${encodeURIComponent(filename)}`;
};

// POST /api/uploads — upload one image or video (multipart field "file")
router.post("/", (req, res) => {
    upload.single("file")(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError &&
                err.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({
                    success: false,
                    message: "File is too large (max 50 MB)"
                });
            }

            return res.status(400).json({
                success: false,
                message: err.message || "Upload failed"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file attached. Use a multipart/form-data field named \"file\"."
            });
        }

        try {
            const quota = getQuota(req.user.id);

            if (quota.bytes + req.file.size > DAILY_QUOTA_BYTES) {
                fs.unlinkSync(req.file.path);
                return res.status(429).json({
                    success: false,
                    message: "Daily upload limit reached. Please try again tomorrow."
                });
            }

            const buffer = fs.readFileSync(req.file.path);
            const detected = sniffFile(buffer);

            if (!detected) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: "Unsupported file type. Allowed: PNG, JPEG, GIF, WebP, MP4 or WebM."
                });
            }

            const limit = detected.kind === "image" ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;

            if (req.file.size > limit) {
                fs.unlinkSync(req.file.path);
                return res.status(413).json({
                    success: false,
                    message: detected.kind === "image"
                        ? "Images must be 10 MB or smaller"
                        : "Videos must be 50 MB or smaller"
                });
            }

            addToQuota(req.user.id, req.file.size);

            return res.status(201).json({
                success: true,
                data: {
                    url: buildPublicUrl(req, req.file.filename),
                    filename: req.file.filename,
                    size: req.file.size,
                    mimeType: detected.mime,
                    kind: detected.kind
                }
            });
        } catch (error) {
            console.error("Upload processing error:", error);

            try {
                if (req.file) fs.unlinkSync(req.file.path);
            } catch { /* already gone */ }

            return res.status(500).json({
                success: false,
                message: "Upload failed"
            });
        }
    });
});

module.exports = router;