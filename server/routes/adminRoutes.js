const express = require("express");

const {
    stats,
    listComplaints,
    updateComplaint,
    listVerification,
    reviewVerification,
    listBusinesses,
    reviewBusinessVerification,
    listUsers,
    updateUser,
    listAdminProviders,
    listAdvertisements,
    reviewAdvertisement,
    listPromotions,
    reviewPromotion
} = require("../controllers/adminController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

router.use(protect, authorize("ADMIN"), rateLimit({ max: 600 }));

router.get("/stats", stats);
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.get("/providers", listAdminProviders);
router.get("/complaints", listComplaints);
router.patch("/complaints/:id", updateComplaint);
router.get("/verification", listVerification);
router.patch("/verification/:id", reviewVerification);
router.get("/businesses", listBusinesses);
router.patch("/businesses/:id", reviewBusinessVerification);
router.get("/advertisements", listAdvertisements);
router.patch("/advertisements/:id", reviewAdvertisement);
router.get("/promotions", listPromotions);
router.patch("/promotions/:id", reviewPromotion);

module.exports = router;