const express = require("express");

const {
    register,
    login,
    me,
    updateProfile,
    logout,
    changePassword,
    requestPasswordReset,
    resetPassword
} = require("../controllers/authController");

const {
    protect
} = require("../middleware/authMiddleware");

const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

router.post("/register", rateLimit({ max: 10 }), register);
router.post("/login", rateLimit({ max: 20 }), login);
router.get("/me", protect, me);
router.patch("/profile", protect, updateProfile);
router.post("/logout", logout);
router.post("/change-password", protect, changePassword);
router.post("/forgot-password", rateLimit({ max: 5 }), requestPasswordReset);
router.post("/reset-password", rateLimit({ max: 5 }), resetPassword);

module.exports = router;