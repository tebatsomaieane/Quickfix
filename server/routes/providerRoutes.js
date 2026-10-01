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

const { validate } = require("../validators");
const { content } = require("../validators/schemas");

const router = express.Router();

router.get("/", getAll);
router.get("/me", protect, authorize("PROVIDER"), me);
router.patch(
    "/me",
    protect,
    authorize("PROVIDER"),
    validate(content.providerProfile),
    updateMe
);
router.put(
    "/me/services",
    protect,
    authorize("PROVIDER"),
    validate(content.providerServices),
    updateMyServices
);
router.put(
    "/me/availability",
    protect,
    authorize("PROVIDER"),
    validate(content.providerAvailability),
    updateMyAvailability
);
router.get("/:id", getById);

module.exports = router;