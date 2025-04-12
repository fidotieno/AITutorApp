const express = require("express");
const {
  startConversation,
  sendMessage,
  getMessages,
  fetchConversations,
} = require("../controllers/messageController");
const protect = require("../middleware/authMiddleware");

module.exports = () => {
  const router = express.Router();
  router.post("/", protect, sendMessage);
  router.post("/conversation", protect, startConversation);
  router.get("/conversations", protect, fetchConversations);
  router.get("/:conversationId", protect, getMessages);

  return router;
};
