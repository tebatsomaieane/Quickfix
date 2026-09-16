const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const uploadsDir = path.join(__dirname, "..", "uploads");

const MIN_AGE_MS =
    (Number(process.env.UPLOAD_ORPHAN_MINUTES) || 24 * 60) * 60 * 1000;

// All tables/columns that can hold an uploaded file reference. URL columns
// store the full /uploads/... link, request_attachments also stores the
// plain file name.
const REFERENCE_QUERIES = [
    "SELECT file_name AS ref FROM request_attachments WHERE file_name IS NOT NULL",
    "SELECT f_url AS ref FROM (SELECT file_url AS f_url FROM request_attachments WHERE file_url IS NOT NULL) x",
    "SELECT profile_image AS ref FROM customer_profiles WHERE profile_image IS NOT NULL",
    "SELECT profile_image AS ref FROM provider_profiles WHERE profile_image IS NOT NULL",
    "SELECT logo AS ref FROM businesses WHERE logo IS NOT NULL",
    "SELECT cover_image AS ref FROM businesses WHERE cover_image IS NOT NULL",
    "SELECT image AS ref FROM services WHERE image IS NOT NULL",
    "SELECT image AS ref FROM categories WHERE image IS NOT NULL",
    "SELECT image AS ref FROM products WHERE image IS NOT NULL",
    "SELECT image AS ref FROM advertisements WHERE image IS NOT NULL"
];

const basenameFromUrl = (url) => {
    try {
        const cleaned = String(url).split("?")[0];
        return decodeURIComponent(cleaned.split("/").pop());
    } catch {
        return String(url).split("/").pop();
    }
};

const cleanupOrphanUploads = async () => {
    let files;

    try {
        files = fs.readdirSync(uploadsDir);
    } catch {
        return 0;
    }

    if (files.length === 0) return 0;

    const now = Date.now();

    const stale = files
        .map((name) => {
            const filePath = path.join(uploadsDir, name);
            let stat;

            try { stat = fs.statSync(filePath); } catch { return null; }

            if (!stat.isFile()) return null;

            return { name, filePath, age: now - stat.mtimeMs };
        })
        .filter((entry) => entry && entry.age > MIN_AGE_MS);

    if (stale.length === 0) return 0;

    let referenced = new Set();

    try {
        const [rows] = await db.query(REFERENCE_QUERIES.join(" UNION ALL "));

        referenced = new Set(
            rows
                .map((row) => basenameFromUrl(row.ref))
                .filter(Boolean)
        );
    } catch (error) {
        console.warn("[cleanup] Could not read media references from DB:", error.message);
    }

    let deleted = 0;

    for (const entry of stale) {
        if (referenced.has(entry.name)) continue;

        try {
            fs.unlinkSync(entry.filePath);
            deleted += 1;
        } catch { /* best effort */ }
    }

    if (deleted > 0) {
        console.log(`[cleanup] Removed ${deleted} orphaned upload(s) older than ${Math.round(MIN_AGE_MS / 60000)} min.`);
    }

    return deleted;
};

// Scheduler. Interval in minutes comes from UPLOAD_CLEANUP_MINUTES
// (defaults to 6 hours, 0 disables the job).
const startUploadCleanup = () => {
    const intervalMinutes = Number(process.env.UPLOAD_CLEANUP_MINUTES) || 360;

    if (intervalMinutes <= 0) return;

    const timer = setInterval(() => {
        cleanupOrphanUploads().catch((error) => {
            console.error("[cleanup] Upload cleanup job failed:", error.message);
        });
    }, intervalMinutes * 60 * 1000);

    timer.unref?.();
};

module.exports = {
    cleanupOrphanUploads,
    startUploadCleanup
};