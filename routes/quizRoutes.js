const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getQuizzesByCourse,
  getSingleQuiz,
  editQuiz,
  deleteQuiz,
  getAvailableQuizzes,
  submitQuiz,
  getQuizResults,
  gradeQuizSubmission,
  getQuizSubmissions,
} = require("../controllers/quizController");
const protect = require("../middleware/authMiddleware");

router.get("/:courseId", protect, getQuizzesByCourse); // Get all quizzes for a course
router.get("/:quizId/single", protect, getSingleQuiz);
router.get("/:quizId/submissions", protect, getQuizSubmissions);
router.get("/:courseId/available", protect, getAvailableQuizzes); // Fetch available quizzes
router.get("/:quizId/results", protect, getQuizResults); // Fetch quiz results
router.put("/:quizId", protect, editQuiz); // Edit a quiz
router.post("/", protect, createQuiz); // Create a new quiz
router.post("/:quizId/submit", protect, submitQuiz); // Submit quiz
router.put("/:quizId/grade/:studentId", protect, gradeQuizSubmission); // Grade a quiz submission
router.delete("/:quizId", protect, deleteQuiz); // Delete a quiz

module.exports = router;
