const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    listMine,
    createOrFind,
    getById,
    sendMessage,
    markRead
} = require("../controllers/conversationController");

// Messaging is only for customers and providers
router.use(protect);

router.get("/my", listMine);
router.post("/", createOrFind);
router.get("/:id", getById);
router.post("/:id/messages", sendMessage);
router.post("/:id/read", markRead);

module.exports = router;