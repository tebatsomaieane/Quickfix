const express = require("express");

const {
    listMine,
    create,
    update,
    withdraw,
    accept
} = require("../controllers/offerController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/my", protect, authorize("PROVIDER"), listMine);
router.post("/", protect, authorize("PROVIDER"), create);
router.put(
    "/:id",
    protect,
    authorize("PROVIDER"),
    update
);
router.post(
    "/:id/withdraw",
    protect,
    authorize("PROVIDER"),
    withdraw
);
router.post(
    "/:id/accept",
    protect,
    authorize("CUSTOMER"),
    accept
);

module.exports = router;