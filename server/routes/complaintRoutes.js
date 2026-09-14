const express = require("express");

const {
    create,
    listMine,
    getById
} = require("../controllers/complaintController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("CUSTOMER", "PROVIDER"));

router.get("/my", listMine);
router.post("/", create);
router.get("/:id", getById);

module.exports = router;