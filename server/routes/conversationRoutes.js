const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/rateLimit");

const {
    listMine,
    createOrFind,
    getById,
    sendMessage,
    markRead
} = require("../controllers/conversationController");

const { validate } = require("../validators");
const { content } = require("../validators/schemas");

// Messaging is only for customers and providers
router.use(protect);

router.get("/my", listMine);
router.post(
    "/",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 60 }),
    validate(content.startConversation),
    createOrFind
);
router.get("/:id", getById);
router.post(
    "/:id/messages",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 120 }),
    validate(content.sendMessage),
    sendMessage
);
router.post("/:id/read", rateLimit({ windowMs: 15 * 60 * 1000, max: 120 }), markRead);

module.exports = router;