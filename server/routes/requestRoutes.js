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

const { validate } = require("../validators");
const { content } = require("../validators/schemas");

const router = express.Router();

router.use(protect, authorize("CUSTOMER"));

router.get("/", listForCustomer);
router.post(
    "/",
    validate(content.createRequest, {
        // Cross-field: a range whose minimum is above its maximum is unusable,
        // and both inputs are individually well-formed.
        refine: (values) => {
            const min = Number(values.budget_min);
            const max = Number(values.budget_max);

            if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;

            return min > max
                ? { budget_min: "The minimum budget cannot be more than the maximum budget" }
                : undefined;
        }
    }),
    create
);
router.get("/:id", getById);
router.post("/:id/cancel", cancel);

module.exports = router;