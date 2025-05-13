const Conversation = require("../models/conversationModel.js");
const Message = require("../models/messageModel.js");

const capitalize = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const startConversation = async (req, res) => {
  let { userId1, userType1, userId2, userType2 } = req.body;

  userType1 = capitalize(userType1);
  userType2 = capitalize(userType2);

  try {
    const conversation = await Conversation.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: userId1, userType: userType1 } },
          { $elemMatch: { userId: userId2, userType: userType2 } },
        ],
      },
    });

    if (conversation) {
      return res.status(200).json(conversation);
    }

    const newConversation = new Conversation({
      participants: [
        { userId: userId1, userType: userType1 },
        { userId: userId2, userType: userType2 },
      ],
    });

    await newConversation.save();
    res.status(200).json(newConversation);
  } catch (error) {
    console.error("Error starting conversation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const sendMessage = async (req, res) => {
  let { conversationId, senderId, senderType, content } = req.body;

  senderType = capitalize(senderType);

  try {
    const message = new Message({
      conversationId,
      sender: { userId: senderId, userType: senderType },
      content,
    });

    await message.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchConversations = async (req, res) => {
  try {
    const { _id, role } = req.user;

    const formattedRole = capitalize(role);

    const conversations = await Conversation.find({
      participants: { $elemMatch: { userId: _id, userType: formattedRole } },
    })
      .populate("lastMessage")
      .populate({
        path: "participants.userId",
        select: "name email",
      });

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Error retrieving conversations" });
  }
};

module.exports = {
  getMessages,
  startConversation,
  sendMessage,
  fetchConversations,
};
