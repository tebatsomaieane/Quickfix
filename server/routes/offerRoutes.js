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
const { validate } = require("../validators");
const { content } = require("../validators/schemas");

const router = express.Router();

router.get("/my", protect, authorize("PROVIDER"), listMine);
router.post(
    "/",
    protect,
    authorize("PROVIDER"),
    rateLimit({ max: 60 }),
    validate(content.createOffer),
    create
);
router.put(
    "/:id",
    protect,
    authorize("PROVIDER"),
    rateLimit({ max: 60 }),
    validate(content.updateOffer),
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