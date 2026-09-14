const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    summary,
    overview,
    activePromotions,
    activeAdvertisements
} = require("../controllers/marketController");

// Promotion and advertisement browsing is public.
router.get("/promotions", activePromotions);
router.get("/advertisements", activeAdvertisements);
router.get("/overview", overview);

// Dashboard summary requires login
router.get("/summary", protect, summary);

module.exports = router;