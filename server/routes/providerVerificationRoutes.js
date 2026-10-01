const express = require("express");

const {
    request,
    mine
} = require("../controllers/verificationController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const { validate } = require("../validators");
const { content } = require("../validators/schemas");

const router = express.Router();

router.use(protect, authorize("PROVIDER"));

router.get("/", mine);
router.post("/", validate(content.verificationRequest), request);

module.exports = router;