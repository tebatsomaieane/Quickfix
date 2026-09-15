const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// User-uploaded media lives on the API server's disk. Cloudflare Pages
// (the frontend host) has no persistent storage, so uploads must always
// go through this API.
const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|webp|gif/;
const ALLOWED_VIDEO_TYPES = /mp4|webm|quicktime/;

const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ext || ".bin";
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExt}`);
    }
});

const fileFilter = (req, file, cb) => {
    const mime = String(file.mimetype || "");
    const isImage = ALLOWED_IMAGE_TYPES.test(mime);
    const isVideo = ALLOWED_VIDEO_TYPES.test(mime);

    if (isImage || isVideo) {
        cb(null, true);
    } else {
        cb(new Error("Only image and video files are allowed"));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter
});

// Build an absolute public URL for the stored file so the client can
// always render it, regardless of which host it points at.
const toPublicUrl = (req, filename) => {
    const base =
        process.env.PUBLIC_API_URL ||
        `${req.protocol}://${req.get("host")}`;

    /* istanbul ignore next */
    return `${base.replace(/\/$/, "")}/uploads/${encodeURIComponent(filename)}`;
};

// POST /api/uploads — upload one image or video (multipart field "file")
router.post("/", protect, (req, res) => {
    upload.single("file")(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(413).json({
                        success: false,
                        message: "File is too large (max 50 MB)"
                    });
                }
                if (err.code === "LIMIT_UNEXPECTED_FILE") {
                    return res.status(400).json({
                        success: false,
                        message: "Please send a single file in the \"file\" field"
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: err.message
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

        const isVideo = String(req.file.mimetype || "").startsWith("video/");

        return res.status(201).json({
            success: true,
            data: {
                url: toPublicUrl(req, req.file.filename),
                filename: req.file.filename,
                size: req.file.size,
                mimeType: req.file.mimetype,
                kind: isVideo ? "video" : "image"
            }
        });
    });
});

module.exports = router;