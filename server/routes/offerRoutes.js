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

const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

router.get("/my", protect, authorize("PROVIDER"), listMine);
router.post("/", protect, authorize("PROVIDER"), rateLimit({ max: 60 }), create);
router.put(
    "/:id",
    protect,
    authorize("PROVIDER"),
    rateLimit({ max: 60 }),
    update
);
router.post(
    "/:id/withdraw",
    protect,
    authorize("PROVIDER"),
    rateLimit({ max: 60 }),
    withdraw
);
router.post(
    "/:id/accept",
    protect,
    authorize("CUSTOMER"),
    rateLimit({ max: 60 }),
    accept
);

module.exports = router;