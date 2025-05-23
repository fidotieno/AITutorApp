const express = require("express");
const {
  createCourse,
  getCourse,
  getCourses,
  enrollCourse,
  getEnrolledCourses,
  getPendingEnrolledCourses,
  getCreatedCourses,
  editCourse,
  uploadCourseFiles,
  replaceCourseFile,
  deleteCourseFile,
  unenrollCourse,
  removeStudentFromCourse,
  deleteCourse,
  cancelEnrollmentRequest,
} = require("../controllers/courseController");
const protect = require("../middleware/authMiddleware");

module.exports = (upload) => {
  const router = express.Router();
  router.get("/get-course/:id", getCourse);
  router.get("/get-courses", getCourses);
  router.get("/get-enrolled-courses", protect, getEnrolledCourses);
  router.get("/get-pending-enrolled-courses", protect, getPendingEnrolledCourses);
  router.get("/get-created-courses", protect, getCreatedCourses);
  router.post("/create-course", protect, createCourse);
  router.post(
    "/upload-files/:id",
    protect,
    upload.array("files", 10),
    uploadCourseFiles
  );
  router.post("/enroll-course", protect, enrollCourse);
  router.put("/edit-course/:id", protect, editCourse);
  router.put(
    "/:id/replace-file/:fileName",
    protect,
    upload.single("file"),
    replaceCourseFile
  );
  router.delete("/:id/delete-file/:fileName", protect, deleteCourseFile);
  router.delete("/:id/unenroll", protect, unenrollCourse);
  router.delete(
    "/:id/remove-student/:studentId",
    protect,
    removeStudentFromCourse
  );
  router.delete("/:id/delete-course", protect, deleteCourse);
  router.delete("/:courseId/remove-enrollment", protect, cancelEnrollmentRequest);

  return router;
};
