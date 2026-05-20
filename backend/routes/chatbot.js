const express = require("express");
const router = express.Router();
const chatbotController = require("../controller/chatbot");

// POST endpoint to ask chatbot questions
router.post("/ask", chatbotController.askQuestion);

module.exports = router;
