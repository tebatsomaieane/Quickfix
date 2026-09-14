const express = require("express");

const {
    request,
    mine
} = require("../controllers/verificationController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("PROVIDER"));

router.get("/", mine);
router.post("/", request);

module.exports = router;