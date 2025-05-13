const express = require("express");
const router = express.Router();
const {
  createAdmin,
  linkParentsToStudent,
  getStudentFees,
  recordStudentFee,
} = require("../controllers/adminController");
const { getUsersByRole } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");

router.post("/create", protect, createAdmin);
router.get("/students", protect, getUsersByRole);
router.put("/students/:studentId/parents", protect, linkParentsToStudent);
router.get("/students/:studentId/fees", protect, getStudentFees);
router.post("/students/:studentId/fees", protect, recordStudentFee);

module.exports = router;
