const express = require("express");
const router = express.Router();
const {
  createExam,
  getExamsByCourse,
  getSingleExam,
  editExam,
  deleteExam,
  getAvailableExams,
  submitExam,
  getExamResults,
  gradeExamSubmission,
  getExamSubmissions,
} = require("../controllers/examController");
const protect = require("../middleware/authMiddleware");

router.get("/:examId/single", protect, getSingleExam);
router.get("/:examId/submissions", protect, getExamSubmissions);
router.get("/:courseId", protect, getExamsByCourse); // Get all exams for a course
router.get("/:courseId/available", protect, getAvailableExams); // Fetch available exams
router.get("/:examId/results", protect, getExamResults); // Fetch exam results
router.post("/:examId/submit", protect, submitExam); // Submit exam
router.post("/", protect, createExam); // Create an exam
router.put("/:examId/grade/:studentId", protect, gradeExamSubmission); // Grade an exam submission
router.put("/:examId", protect, editExam); // Edit an exam
router.delete("/:examId", protect, deleteExam); // Delete an exam

module.exports = router;
