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
  generateQuizQuestions,
} = require("../controllers/quizController");
const protect = require("../middleware/authMiddleware");

// ---- Specific routes first ----
router.post("/", protect, createQuiz); // Create a new quiz
router.post("/generate-questions", protect, generateQuizQuestions);

router.get("/:courseId/available", protect, getAvailableQuizzes); // Fetch available quizzes
router.get("/:quizId/single", protect, getSingleQuiz); // Get a single quiz
router.get("/:quizId/submissions", protect, getQuizSubmissions); // Get quiz submissions
router.get("/:quizId/results", protect, getQuizResults); // Get quiz results
router.post("/:quizId/submit", protect, submitQuiz); // Submit quiz
router.put("/:quizId/grade/:studentId", protect, gradeQuizSubmission); // Grade a quiz submission
router.put("/:quizId", protect, editQuiz); // Edit a quiz
router.delete("/:quizId", protect, deleteQuiz); // Delete a quiz

// ---- Generic route LAST ----
router.get("/:courseId", protect, getQuizzesByCourse); // Get all quizzes for a course

module.exports = router;
