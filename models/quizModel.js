const Mongoose = require("mongoose");

const QuestionSchema = new Mongoose.Schema({
  questionText: { type: String, required: true },
  type: {
    type: String,
    enum: ["multiple-choice", "open-ended"],
    required: true,
  },
  options: [{ type: String }],
  correctAnswer: { type: String },
  points: { type: Number, default: 1 },
});

const QuizSchema = new Mongoose.Schema(
  {
    courseId: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacherId: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    questions: [QuestionSchema],
    deadline: { type: Date, required: true },
    timeLimit: { type: Number },
    submissions: [
      {
        studentId: { type: Mongoose.Schema.Types.ObjectId, ref: "Student" },
        answers: [
          {
            questionId: Mongoose.Schema.Types.ObjectId,
            response: String,
            feedback: String,
          },
        ],
        score: { type: Number, default: null },
        graded: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

module.exports = Mongoose.model("Quiz", QuizSchema);
