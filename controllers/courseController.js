const Student = require("../models/studentModel");
const Teacher = require("../models/teacherModel");
const Course = require("../models/courseModel");
const { uploadFileToDropbox } = require("../utils/functions/dropboxUpload");

const createCourse = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const teacher = req.user;
    if (teacher.role !== "teacher")
      return res
        .status(403)
        .json({ message: "You are not authorized to access this resource!" });
    const newCourse = new Course({
      title,
      description,
      teacherId: teacher._id,
    });
    await newCourse.save();
    teacher.coursesCreated.push(newCourse._id);
    await teacher.save();
    if (!newCourse)
      return res.status(400).json({ message: "Failed to create course." });
    return res.status(201).json({ message: "Course created successfully!" });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while creating the course.",
      error: error.message,
    });
  }
};

const getCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId).populate({
      path: "studentsEnrolled",
      select: "name email",
    });
    return res
      .status(200)
      .json({ message: "Successfully fetched the course!", course });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching course", error });
  }
};

const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().populate("teacherId", "name email");
    if (!courses) return res.status(404).json({ message: "No courses found." });
    return res.status(200).json({
      message: "Courses fetched successfully!",
      courses,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while fetching courses.",
      error: error.message,
    });
  }
};

const enrollCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    const student = req.user;
    if (!course)
      return res.status(403).json({ message: "Invalid courseId entered!" });
    if (student.role !== "student")
      return res
        .status(403)
        .json({ message: "You are not authorized to access this resource!" });
    if (student.enrolledCourses.includes(courseId)) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this course" });
    }
    student.enrolledCourses.push(courseId);
    course.studentsEnrolled.push(student._id);
    await student.save();
    await course.save();
    res.status(200).json({ message: "Successfully enrolled!" });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while enrolling in the course.",
      error: error.message,
    });
  }
};

const getEnrolledCourses = async (req, res, next) => {
  try {
    const student = req.user;
    if (student.role !== "student")
      return res
        .status(404)
        .json({ message: "You are not authorized to access this resource!" });
    const studentWithCourses = await Student.findById(student._id)
      .populate({
        path: "enrolledCourses",
        populate: {
          path: "teacherId",
          select: "name",
        },
      })
      .select("enrolledCourses");
    const enrolledCourses = studentWithCourses.enrolledCourses;
    return res.status(200).json({
      message: "Successfully fetched enrolled courses.",
      enrolledCourses,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while fetching enrolled courses.",
      error: error.message,
    });
  }
};

const getCreatedCourses = async (req, res, next) => {
  const teacher = req.user;
  if (teacher.role !== "teacher")
    return res
      .status(404)
      .json({ message: "You are not authorized to access this resource!" });
  const teacherWithCourses = await Teacher.findById(teacher._id).populate(
    "coursesCreated"
  );
  const teacherCourses = teacherWithCourses.coursesCreated;
  return res
    .status(200)
    .json({ message: "Created Courses fetched successfully!", teacherCourses });
};

const editCourse = async (req, res, next) => {
  try {
    const teacher = req.user;
    if (teacher.role !== "teacher")
      return res
        .status(404)
        .json({ message: "You are not authorized to access this resource!" });
    const courseId = req.params.id;
    const { title, description } = req.body;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    course.title = title || course.title;
    course.description = description || course.description;
    await course.save();
    return res
      .status(200)
      .json({ message: "Course updated successfully!", course });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while updating the course.",
      error: error.message,
    });
  }
};

const uploadCourseFiles = async (req, res) => {
  try {
    const teacher = req.user;
    if (teacher.role !== "teacher")
      return res
        .status(403)
        .json({ message: "You are not authorized to access this resource!" });
    const courseId = req.params.id;
    if (!courseId)
      return res.status(400).json({ error: "Course ID is required" });

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: "No files uploaded" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const uploadedFiles = [];

    // Upload each file to Dropbox
    for (const file of req.files) {
      const fileUrl = await uploadFileToDropbox(
        baseDirectory = `CourseFiles/${course._id}`,
        file.buffer,
        file.originalname,
        courseId,
        file.mimetype
      );

      // Store file details in MongoDB
      const fileData = {
        url: fileUrl,
        type: file.mimetype.startsWith("image/")
          ? "image"
          : file.mimetype === "application/pdf"
          ? "pdf"
          : "video",
        name: file.originalname,
      };

      course.files.push(fileData);
      uploadedFiles.push(fileData);
    }
    await course.save();

    res.status(201).json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
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
};
