const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getQuizzesByCourse,
  editQuiz,
  deleteQuiz,
  getAvailableQuizzes,
  submitQuiz,
  getQuizResults,
  gradeQuizSubmission,
} = require("../controllers/quizController");
const protect = require("../middleware/authMiddleware");

router.post("/", protect, createQuiz); // Create a new quiz
router.get("/:courseId", protect, getQuizzesByCourse); // Get all quizzes for a course
router.put("/:quizId", protect, editQuiz); // Edit a quiz
router.delete("/:quizId", protect, deleteQuiz); // Delete a quiz
router.get("/:courseId/available", protect, getAvailableQuizzes); // Fetch available quizzes
router.post("/:quizId/submit", protect, submitQuiz); // Submit quiz
router.get("/:quizId/results", protect, getQuizResults); // Fetch quiz results
router.put("/:quizId/grade/:studentId", protect, gradeQuizSubmission); // Grade a quiz submission

module.exports = router;
