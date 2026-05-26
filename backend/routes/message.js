const router = require("express").Router()
const verifyToken = require("../middleware/auth")
const { sendMessage, getConversation, getConversations } = require("../controller/message")

// Send a message to another user
router.post("/:id", verifyToken, sendMessage)

// Get conversation between the logged in user and the specified user
router.get("/:id", verifyToken, getConversation)

// Get all conversations (thread list) for the logged in user
router.get("/", verifyToken, getConversations)

module.exports = router
