const express = require("express");

const {
    create,
    listForCustomer,
    getById,
    cancel
} = require("../controllers/requestController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("CUSTOMER"));

router.get("/", listForCustomer);
router.post("/", create);
router.get("/:id", getById);
router.post("/:id/cancel", cancel);

module.exports = router;