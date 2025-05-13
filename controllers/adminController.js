const Admin = require("../models/adminModel");
const Student = require("../models/studentModel");
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
    console.log(err);
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

module.exports = {
  createAdmin,
  linkParentsToStudent,
  getStudentFees,
  recordStudentFee,
};
