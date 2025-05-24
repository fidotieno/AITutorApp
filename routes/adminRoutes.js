const express = require("express");
const router = express.Router();
const {
  createAdmin,
  linkParentsToStudent,
  getStudentFees,
  recordStudentFee,
  getPendingEnrollmentsForAdmin,
  approveEnrollment,
  rejectEnrollment,
  getUnapprovedStudents,
  approveStudent,
  rejectStudent,
} = require("../controllers/adminController");
const { getUsersByRole } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");

router.post("/create", protect, createAdmin);
router.get("/students", protect, getUsersByRole);
router.get(
  "/students/pending-approvals",
  protect,
  getPendingEnrollmentsForAdmin
);
router.get("/students/pending-system-access", protect, getUnapprovedStudents);
router.put("/students/:studentId/parents", protect, linkParentsToStudent);
router.put("/students/:studentId/approve", protect, approveStudent);
router.delete("/students/:studentId/reject", protect, rejectStudent);
router.get("/students/:studentId/fees", protect, getStudentFees);
router.post("/students/:studentId/fees", protect, recordStudentFee);
router.put(
  "/courses/:courseId/students/:studentId/approve",
  protect,
  approveEnrollment
);
router.put(
  "/courses/:courseId/students/:studentId/reject",
  protect,
  rejectEnrollment
);

module.exports = router;
