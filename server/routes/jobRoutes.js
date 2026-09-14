const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
    listMine,
    getById,
    start,
    complete
} = require("../controllers/jobController");

// Jobs are tied to a customer/provider relationship
router.use(protect);

router.get("/my", listMine);
router.get("/:id", getById);

// Only providers can start/complete jobs
router.post("/:id/start", authorize("PROVIDER"), start);
router.post("/:id/complete", authorize("PROVIDER"), complete);

module.exports = router;