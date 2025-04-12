const express = require("express");
const router = express.Router();
const { getStudentAnalytics } = require("../controllers/analyticsController");
const protect = require("../middleware/authMiddleware");

router.get("/:studentId", protect, getStudentAnalytics);
module.exports = router;
