const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { sseHeaders, subscribe } = require("../utils/realtime");

const router = express.Router();

// GET /api/events — Server-Sent Events stream for the logged-in user.
//
// Concern: EventSource cannot set Authorization headers, so auth relies on
// the httpOnly session cookie (same cookie the rest of the app uses). The
// stream never contains sensitive data - payloads are "something changed"
// hints; clients refetch from the regular REST endpoints.
router.get("/", protect, (req, res) => {
    sseHeaders(res);

    const close = subscribe(req.user.id, res);

    res.on("close", close);
});

module.exports = router;