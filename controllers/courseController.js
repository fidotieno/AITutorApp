const Student = require("../models/studentModel");
const Teacher = require("../models/teacherModel");
const Course = require("../models/courseModel");
const {
  uploadFileToDropbox,
  replaceFileInDropbox,
  deleteFileFromDropbox,
} = require("../utils/functions/dropboxUpload");

const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      level,
      prerequisites = [],
      courseFormat,
      objectives = [],
    } = req.body;

    const teacher = req.user;

    if (teacher.role !== "teacher") {
      return res.status(403).json({ message: "Unauthorized access!" });
    }

    const newCourse = new Course({
      title,
      description,
      duration,
      level,
      prerequisites,
      courseFormat,
      objectives,
      teacherId: teacher._id,
      totalStudentsEnrolled: 0, // Initialize with 0 students
    });

    await newCourse.save();

    teacher.coursesCreated.push(newCourse._id);
    await teacher.save();

    return res
      .status(201)
      .json({ message: "Course created successfully!", course: newCourse });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating course", error: error.message });
  }
};

const getCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId).populate(
      "studentsEnrolled",
      "name email profilePhoto"
    ).populate("teacherId", "name");
    return res
      .status(200)
      .json({ message: "Course fetched successfully!", course });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching course", error });
  }
};

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("teacherId", "name email");
    return res
      .status(200)
      .json({ message: "Courses fetched successfully!", courses });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching courses", error: error.message });
  }
};

const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const student = req.user;
    if (student.role !== "student")
      return res.status(403).json({ message: "Unauthorized access!" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found!" });

    if (student.enrolledCourses.includes(courseId))
      return res.status(400).json({ message: "Already enrolled!" });

    student.enrolledCourses.push(courseId);
    course.studentsEnrolled.push(student._id);
    course.totalStudentsEnrolled++;

    await student.save();
    await course.save();

    res.status(200).json({ message: "Successfully enrolled!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error enrolling in course", error: error.message });
  }
};

const unenrollCourse = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;
    const student = req.user;

    if (student.role !== "student")
      return res.status(403).json({ message: "Unauthorized!" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    student.enrolledCourses = student.enrolledCourses.filter(
      (id) => id.toString() !== courseId
    );
    course.studentsEnrolled = course.studentsEnrolled.filter(
      (id) => id.toString() !== student._id.toString()
    );
    course.totalStudentsEnrolled--;

    await student.save();
    await course.save();

    res.status(200).json({ message: "Unenrolled successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error unenrolling from course", error: error.message });
  }
};

const removeStudentFromCourse = async (req, res) => {
  try {
    const { id: courseId, studentId } = req.params;
    const teacher = req.user;

    if (teacher.role !== "teacher")
      return res.status(403).json({ message: "Unauthorized!" });

    const course = await Course.findById(courseId);
    const student = await Student.findById(studentId);
    if (!course || !student)
      return res.status(404).json({ message: "Course or Student not found" });

    student.enrolledCourses = student.enrolledCourses.filter(
      (id) => id.toString() !== courseId
    );
    course.studentsEnrolled = course.studentsEnrolled.filter(
      (id) => id.toString() !== studentId
    );
    course.totalStudentsEnrolled--;

    await student.save();
    await course.save();

    res.status(200).json({ message: "Student removed successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing student", error: error.message });
  }
};

const getEnrolledCourses = async (req, res) => {
  try {
    const student = req.user;
    if (student.role !== "student")
      return res.status(403).json({ message: "Unauthorized access!" });

    const studentWithCourses = await Student.findById(student._id)
      .populate({
        path: "enrolledCourses",
        populate: { path: "teacherId", select: "name" },
      })
      .select("enrolledCourses");

    return res.status(200).json({
      message: "Enrolled courses fetched successfully!",
      enrolledCourses: studentWithCourses.enrolledCourses,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching enrolled courses",
      error: error.message,
    });
  }
};

const getCreatedCourses = async (req, res) => {
  try {
    const teacher = req.user;
    if (teacher.role !== "teacher")
      return res.status(403).json({ message: "Unauthorized access!" });

    const teacherWithCourses = await Teacher.findById(teacher._id).populate(
      "coursesCreated"
    );

    return res.status(200).json({
      message: "Created courses fetched successfully!",
      teacherCourses: teacherWithCourses.coursesCreated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching created courses",
      error: error.message,
    });
  }
};

const editCourse = async (req, res) => {
  try {
    const teacher = req.user;

    if (teacher.role !== "teacher") {
      return res.status(403).json({ message: "Unauthorized access!" });
    }

    const courseId = req.params.id;
    const {
      title,
      description,
      duration,
      level,
      prerequisites,
      courseFormat,
      objectives,
    } = req.body;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    // Ensure only the teacher who created the course can edit it
    if (course.teacherId.toString() !== teacher._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own courses!" });
    }

    // Update fields only if new values are provided
    course.title = title || course.title;
    course.description = description || course.description;
    course.duration = duration || course.duration;
    course.level = level || course.level;
    course.prerequisites =
      prerequisites !== undefined ? prerequisites : course.prerequisites;
    course.courseFormat = courseFormat || course.courseFormat;
    course.objectives =
      objectives !== undefined ? objectives : course.objectives;

    await course.save();

    return res
      .status(200)
      .json({ message: "Course updated successfully!", course });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating course", error: error.message });
  }
};

const uploadCourseFiles = async (req, res) => {
  try {
    const teacher = req.user;
    if (teacher.role !== "teacher")
      return res.status(403).json({ message: "Unauthorized access!" });

    const courseId = req.params.id;
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "No files uploaded" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const uploadedFiles = [];
    for (const file of req.files) {
      const fileData = await uploadFileToDropbox(
        `/CourseFiles/${course._id}`,
        file.buffer,
        file.originalname,
        file.mimetype
      );
      course.files.push(fileData);
      uploadedFiles.push(fileData);
    }
    await course.save();
    res
      .status(201)
      .json({ message: "Files uploaded successfully", files: uploadedFiles });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error uploading files", error: error.message });
  }
};

// **Delete Course File**
const deleteCourseFile = async (req, res) => {
  try {
    const { id, fileName } = req.params;
    const teacher = req.user;
    if (teacher.role !== "teacher")
      return res.status(403).json({ message: "Unauthorized access!" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const fileIndex = course.files.findIndex((f) => f.name === fileName);
    if (fileIndex === -1)
      return res.status(404).json({ message: "File not found!" });

    await deleteFileFromDropbox(`/CourseFiles/${id}/${fileName}`);

    course.files.splice(fileIndex, 1);
    await course.save();

    res.status(200).json({ message: "File deleted successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting file", error: error.message });
  }
};

// **Replace Course File**
const replaceCourseFile = async (req, res) => {
  try {
    const { id, fileName } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const teacher = req.user;
    if (teacher.role !== "teacher")
      return res.status(403).json({ message: "Unauthorized access!" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const newFile = await replaceFileInDropbox(
      `/CourseFiles/${id}`,
      fileName,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const fileIndex = course.files.findIndex((f) => f.name === fileName);
    course.files[fileIndex] = newFile;
    await course.save();

    res
      .status(200)
      .json({ message: "File replaced successfully!", file: newFile });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error replacing file", error: error.message });
  }
};

module.exports = {
  createCourse,
  getCourse,
  getCourses,
  enrollCourse,
  getEnrolledCourses,
  getCreatedCourses,
  editCourse,
  uploadCourseFiles,
  deleteCourseFile,
  replaceCourseFile,
  unenrollCourse,
  removeStudentFromCourse,
};
