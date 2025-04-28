const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      userType: {
        type: String,
        enum: ["Teacher", "Parent", "Admin"],
        required: true,
      },
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
