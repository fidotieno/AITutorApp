const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    submissions: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        fileUrl: {type: String},
        fileName: {type: String},
        submittedAt: { type: Date, default: Date.now },
        grade: { type: Number, min: 0, max: 100, default: null },
        feedback: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", AssignmentSchema);
