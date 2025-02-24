const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    studentsEnrolled: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    ],
    files: [
      {
        url: { type: String, required: true }, 
        type: { type: String, enum: ["pdf", "video", "image"], required: true },
        name: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
