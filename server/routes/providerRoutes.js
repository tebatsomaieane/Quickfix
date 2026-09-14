const express = require("express");

const {
    getAll,
    getById,
    me,
    updateMe,
    updateMyServices,
    updateMyAvailability
} = require("../controllers/providerController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAll);
router.get("/me", protect, authorize("PROVIDER"), me);
router.patch("/me", protect, authorize("PROVIDER"), updateMe);
router.put("/me/services", protect, authorize("PROVIDER"), updateMyServices);
router.put("/me/availability", protect, authorize("PROVIDER"), updateMyAvailability);
router.get("/:id", getById);

module.exports = router;