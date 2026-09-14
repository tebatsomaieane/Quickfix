const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    listMine,
    markOneRead,
    markAllRead,
    remove
} = require("../controllers/notificationController");

router.use(protect);

router.get("/my", listMine);
router.patch("/:id/read", markOneRead);
router.post("/read", markAllRead);
router.delete("/:id", remove);

module.exports = router;