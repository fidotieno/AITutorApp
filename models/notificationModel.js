const Mongoose = require("mongoose");

const notificationSchema = new Mongoose.Schema(
  {
    recipient: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    type: { type: String, enum: ["quiz", "assignment"], required: true },
    content: { type: String, required: true },
    courseId: { type: Mongoose.Schema.Types.ObjectId, ref: "Course" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = Mongoose.model("Notification", notificationSchema);
