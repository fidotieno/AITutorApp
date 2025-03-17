const express = require("express");
const router = express.Router();
const {
  createExam,
  getExamsByCourse,
  editExam,
  deleteExam,
  getAvailableExams,
  submitExam,
  getExamResults,
  gradeExamSubmission,
} = require("../controllers/examController");
const protect = require("../middleware/authMiddleware");

router.post("/", protect, createExam); // Create an exam
router.get("/:courseId", protect, getExamsByCourse); // Get all exams for a course
router.put("/:examId", protect, editExam); // Edit an exam
router.delete("/:examId", protect, deleteExam); // Delete an exam
router.get("/:courseId/available", protect, getAvailableExams); // Fetch available exams
router.post("/:examId/submit", protect, submitExam); // Submit exam
router.get("/:examId/results", protect, getExamResults); // Fetch exam results
router.put("/:examId/grade/:studentId", protect, gradeExamSubmission); // Grade an exam submission

module.exports = router;
