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

const { validate } = require("../validators");
const { content } = require("../validators/schemas");

const router = express.Router();

router.use(protect, authorize("BUSINESS_OWNER"));

// Profile
router.get("/profile", getProfile);
router.put("/profile", validate(content.businessProfile), updateProfile);

// Products
router.get("/products", getMyProducts);
router.post("/products", validate(content.product), createProduct);
router.put("/products/:id", validate(content.product), updateProduct);
router.delete("/products/:id", deleteProduct);

// Advertisements
router.get("/advertisements", getMyAdvertisements);
router.post("/advertisements", validate(content.advertisement), createAdvertisement);
router.put("/advertisements/:id", validate(content.advertisement), updateAdvertisement);
router.delete("/advertisements/:id", deleteAdvertisement);

// Promotions
router.get("/promotions", getMyPromotions);
router.post("/promotions", validate(content.promotion), createPromotion);
router.put("/promotions/:id", validate(content.promotion), updatePromotion);
router.delete("/promotions/:id", deletePromotion);

// Analytics
router.get("/analytics", analytics);

// Verification
router.post("/verification", requestVerification);

module.exports = router;