const express = require("express");

const {
    getProfile,
    updateProfile,
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getMyAdvertisements,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    getMyPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    analytics,
    requestVerification
} = require("../controllers/businessController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("BUSINESS_OWNER"));

// Profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Products
router.get("/products", getMyProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Advertisements
router.get("/advertisements", getMyAdvertisements);
router.post("/advertisements", createAdvertisement);
router.put("/advertisements/:id", updateAdvertisement);
router.delete("/advertisements/:id", deleteAdvertisement);

// Promotions
router.get("/promotions", getMyPromotions);
router.post("/promotions", createPromotion);
router.put("/promotions/:id", updatePromotion);
router.delete("/promotions/:id", deletePromotion);

// Analytics
router.get("/analytics", analytics);

// Verification
router.post("/verification", requestVerification);

module.exports = router;