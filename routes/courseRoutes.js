const express = require("express");
const router = express.Router();
const {
  createCourse,
  getCourses,
  enrollCourse,
  getEnrolledCourses,
  getCreatedCourses,
} = require("../controllers/courseController");
const protect = require("../middleware/authMiddleware");

router.post("/create-course", protect, createCourse);
router.get("/get-courses", getCourses);
router.post("/enroll-course", protect, enrollCourse);
router.get("/get-enrolled-courses", protect, getEnrolledCourses);
router.get("/get-created-courses", protect, getCreatedCourses);
module.exports = router;
