const express = require("express");

const {
    listAvailable,
    getById
} = require("../controllers/providerRequestController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("PROVIDER"));

router.get("/", listAvailable);
router.get("/:id", getById);

module.exports = router;