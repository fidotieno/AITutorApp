const express = require("express");
const router = express.Router();
const {
  getStudentAnalytics,
  getCourseAnalytics,
} = require("../controllers/analyticsController");
const protect = require("../middleware/authMiddleware");

router.get("/course/:courseId", protect, getCourseAnalytics);
router.get("/:studentId", protect, getStudentAnalytics);
module.exports = router;
