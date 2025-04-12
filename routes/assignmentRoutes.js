const express = require("express");
const {
  createAssignment,
  submitAssignment,
  getAssignments,
  gradeAssignment,
  getAssignmentSubmissions,
  resubmitAssignment,
  deleteAssignment,
} = require("../controllers/assignmentController");
const protect = require("../middleware/authMiddleware");

module.exports = (upload) => {
  const router = express.Router();
  router.get("/:courseId", protect, getAssignments);
  router.get("/:assignmentId/submissions", protect, getAssignmentSubmissions);
  router.post("/:courseId/create", protect, createAssignment);
  router.post(
    "/:assignmentId/submit",
    protect,
    upload.single("file"),
    submitAssignment
  );
  router.put("/:assignmentId/grade/:studentId", protect, gradeAssignment);
  router.put(
    "/:assignmentId/resubmit",
    protect,
    upload.single("file"),
    resubmitAssignment
  );
  router.delete("/:assignmentId", protect, deleteAssignment);

  return router;
};
