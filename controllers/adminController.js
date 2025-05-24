const Admin = require("../models/adminModel");
const Student = require("../models/studentModel");
const Course = require("../models/courseModel");
const FeePayment = require("../models/feePaymentModel");
const bcrypt = require("bcryptjs");

const createAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existing = await Admin.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = new Admin({
    name,
    email,
    password: hashedPassword,
    role: "admin",
  });

  await newAdmin.save();
  res.status(201).json({ message: "New admin account created" });
};

const linkParentsToStudent = async (req, res) => {
  const { studentId } = req.params;
  const { parentEmail1, parentEmail2 } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (parentEmail1) student.parentEmail1 = parentEmail1;
    if (parentEmail2) student.parentEmail2 = parentEmail2;

    await student.save();
    res
      .status(200)
      .json({ message: "Parent emails updated successfully", student });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getStudentFees = async (req, res) => {
  const { studentId } = req.params;

  try {
    const fees = await FeePayment.find({ studentId }).sort({ datePaid: -1 });
    res.status(200).json(fees);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching fee records", error: err.message });
  }
};

const recordStudentFee = async (req, res) => {
  const { studentId } = req.params;
  const { amountPaid, term, isPaidInFull, paymentMethod } = req.body;

  try {
    const newPayment = new FeePayment({
      studentId,
      amountPaid,
      term,
      isPaidInFull,
      paymentMethod,
    });

    await newPayment.save();
    res
      .status(201)
      .json({ message: "Fee payment recorded", payment: newPayment });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error recording payment", error: err.message });
  }
};

const getPendingEnrollmentsForAdmin = async (req, res) => {
  try {
    // Fetch all courses that have pending students
    const courses = await Course.find({
      pendingEnrollments: { $exists: true, $not: { $size: 0 } },
    })
      .populate("pendingEnrollments", "name email") // only name & email for each student
      .select("title courseCode pendingEnrollments"); // only necessary course info

    // Flatten and format the data
    const pendingRequests = [];

    courses.forEach((course) => {
      course.pendingEnrollments.forEach((student) => {
        pendingRequests.push({
          courseId: course._id,
          courseTitle: course.title,
          courseCode: course.courseCode,
          studentId: student._id,
          studentName: student.name,
          studentEmail: student.email,
        });
      });
    });

    res.status(200).json(pendingRequests);
  } catch (err) {
    console.error("Error fetching pending enrollments:", err);
    res.status(500).json({ message: "Failed to fetch pending enrollments." });
  }
};

const approveEnrollment = async (req, res) => {
  try {
    const { courseId: studentId, studentId: courseId } = req.params;
    const admin = req.user;

    if (admin.role !== "admin")
      return res.status(403).json({ message: "Unauthorized access!" });

    const course = await Course.findById(courseId);
    const student = await Student.findById(studentId);

    if (!course || !student)
      return res.status(404).json({ message: "Course or Student not found" });

    const pendingInCourse = course.pendingEnrollments.includes(studentId);
    const pendingInStudent = student.pendingEnrollments.includes(courseId);

    if (!pendingInCourse || !pendingInStudent)
      return res.status(400).json({ message: "No matching pending request" });

    course.pendingEnrollments = course.pendingEnrollments.filter(
      (id) => id.toString() !== studentId
    );
    course.studentsEnrolled.push(student._id);

    student.pendingEnrollments = student.pendingEnrollments.filter(
      (id) => id.toString() !== courseId
    );
    student.enrolledCourses.push(course._id);

    await course.save();
    await student.save();

    return res.status(200).json({ message: "Enrollment approved!" });
  } catch (error) {
    return res.status(500).json({
      message: "Error approving enrollment",
      error: error.message,
    });
  }
};

const rejectEnrollment = async (req, res) => {
  try {
    const { courseId: studentId, studentId: courseId } = req.params;
    const admin = req.user;

    if (admin.role !== "admin")
      return res.status(403).json({ message: "Unauthorized access!" });

    const course = await Course.findById(courseId);
    const student = await Student.findById(studentId);

    if (!course || !student)
      return res.status(404).json({ message: "Course or Student not found" });

    course.pendingEnrollments = course.pendingEnrollments.filter(
      (id) => id.toString() !== studentId
    );
    student.pendingEnrollments = student.pendingEnrollments.filter(
      (id) => id.toString() !== courseId
    );

    await course.save();
    await student.save();

    return res.status(200).json({ message: "Enrollment request rejected." });
  } catch (error) {
    return res.status(500).json({
      message: "Error rejecting enrollment",
      error: error.message,
    });
  }
};

const getUnapprovedStudents = async (req, res, next) => {
  try {
    const admin = req.user;
    if (admin.role !== "admin")
      return res.status(403).json({ message: "Unauthorized access!" });

    const students = await Student.find({ isApproved: false }).select(
      "name email createdAt"
    );
    res.status(200).json(students);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching unapproved students",
      error: error.message,
    });
  }
};

const approveStudent = async (req, res, next) => {
  try {
    const admin = req.user;
    const { studentId } = req.params;

    if (admin.role !== "admin")
      return res.status(403).json({ message: "Unauthorized access!" });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (student.isApproved)
      return res.status(400).json({ message: "Student is already approved" });

    student.isApproved = true;
    await student.save();

    res.status(200).json({ message: "Student approved successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error approving student",
      error: error.message,
    });
  }
};

const rejectStudent = async (req, res, next) => {
  try {
    const admin = req.user;
    const { studentId } = req.params;

    if (admin.role !== "admin")
      return res.status(403).json({ message: "Unauthorized access!" });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    await Student.deleteOne({ _id: studentId });

    res.status(200).json({ message: "Student rejected and deleted." });
  } catch (error) {
    res.status(500).json({
      message: "Error rejecting student",
      error: error.message,
    });
  }
};

module.exports = {
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
};
