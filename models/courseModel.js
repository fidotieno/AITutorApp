const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    courseCode: {
      type: String,
      required: true,
      unique: true,
    },
    description: { type: String, required: true },
    duration: { type: String, required: true }, // e.g., "5 weeks", "10 hours"
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },
    prerequisites: [{ type: String }], // e.g., ["Basic HTML", "JavaScript"]
    courseFormat: {
      type: String,
      required: true,
    },
    objectives: [{ type: String }], // What students will learn
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    studentsEnrolled: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    ],
    pendingEnrollments: [
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
