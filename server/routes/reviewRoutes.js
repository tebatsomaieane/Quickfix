const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
    create,
    listEligible,
    respondToReview
} = require("../controllers/reviewController");

router.use(protect);

// Only customers can review their completed jobs
router.get("/eligible", authorize("CUSTOMER"), listEligible);
router.post("/", authorize("CUSTOMER"), create);

// Providers can respond to reviews on their own work
router.post("/:id/respond", authorize("PROVIDER"), respondToReview);

module.exports = router;