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

const { validate } = require("../validators");
const { content } = require("../validators/schemas");

const router = express.Router();

router.use(protect, authorize("CUSTOMER", "PROVIDER"));

router.get("/my", listMine);
router.post("/", validate(content.complaint), create);
router.get("/:id", getById);

module.exports = router;