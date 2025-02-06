const bcrypt = require("bcryptjs");
// const fs = require("fs");
const jwt = require("jsonwebtoken");
// const path = require("path");
// const sendEmail = require("../utils/sendEmail");
const Student = require("../models/studentModel");
const Teacher = require("../models/teacherModel");
const Admin = require("../models/adminModel");
const Parent = require("../models/parentModel");
const {createUser} = require("../utils/functions/authFunctions");

const register = async (req, res, next) => {
  const { name, role, email, password } = req.body;
  if (!name || !role || !email || !password) {
    return res
      .status(400)
      .json({ message: "Kindly fill in all the necessary details." });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long." });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    if (role == "student") {
      await createUser(Student, role, email, name, hashedPassword, res);
    } else if (role == "teacher") {
      await createUser(Teacher, role, email, name, hashedPassword, res);
    } else if (role == "parent") {
      await createUser(Parent, role, email, name, hashedPassword, res);
    } else if (role == "admin") {
      await createUser(Admin, role, email, name, hashedPassword, res);
    } else {
      return res.status(400).json({ message: "Invalid role specified." });
    }
    // const filePath = path.join(__dirname, "../utils/mailingAssets/hello.html");
    // const templateString = fs.readFileSync(filePath, "utf8");
    // const emailContent = templateString
    //   .replace("${name}", name)
    //   .replace("${loginLink}", `${process.env.CLIENT_URL}/login`);
    // const emailSent = await sendEmail(
    //   email,
    //   "Welcome to FleetEase",
    //   emailContent
    // );
    // if (!emailSent) {
    //   return res.status(400).json({ message: "Invalid email" });
    // }
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ message: "Invalid credentials entered" });
  }
  try {
    const student = await Student.findOne({ email });
    const teacher = await Teacher.findOne({ email });
    const admin = await Admin.findOne({ email });
    const parent = await Parent.findOne({ email });

    const user = student || teacher || admin || parent;
    if (!user) {
      return res.status(422).json({ message: "Invalid credentials entered" });
    }
    if (user.matchPassword(password)) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      const { password: _, ...userWithoutPassword } = user.toObject();
      res.status(200).json({
        message: "Login successful!",
        token: token,
        user: userWithoutPassword,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to login." });
  }
};

const forgotPassword = (req, res, next) => {};

const resetPassword = (req, res, next) => {};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
