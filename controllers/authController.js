const bcrypt = require("bcryptjs");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const sendEmail = require("../utils/sendEmail");
const Student = require("../models/studentModel");
const Teacher = require("../models/teacherModel");
const Admin = require("../models/adminModel");
const Parent = require("../models/parentModel");
const {
  createUser,
  checkEmailExists,
  checkIdExists,
} = require("../utils/functions/authFunctions");

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
    const filePath = path.join(__dirname, "../utils/mailingAssets/hello.html");
    const templateString = fs.readFileSync(filePath, "utf8");
    const emailContent = templateString
      .replace("${name}", name)
      .replace("${loginLink}", `${process.env.CLIENT_URL}/login`);
    const emailSent = await sendEmail(
      email,
      "Welcome to EduTech",
      emailContent
    );
    if (!emailSent) {
      return res.status(400).json({ message: "Invalid email" });
    } else {
      return res.status(201).json({ message: "User Created Successfully!" });
    }
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
    const isMatch = await user.matchPassword(password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      const { password: _, ...userWithoutPassword } = user.toObject();
      if (parent) {
        const children = await Student.find({
          $or: [{ parentEmail1: email }, { parentEmail2: email }],
        }).select("-password");
        return res.status(200).json({
          message: "Login successful!",
          token: token,
          user: userWithoutPassword,
          children,
        });
      }
      return res.status(200).json({
        message: "Login successful!",
        token: token,
        user: userWithoutPassword,
      });
    } else {
      return res.status(422).json({
        message: "Invalid credentials entered",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to login." });
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "All fields are required!" });
  }
  const user = await checkEmailExists(email);
  if (!user) {
    return res.status(404).json({ message: "User not found!" });
  }
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
  const resetURL = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;
  const filePath = path.join(
    __dirname,
    "../utils/mailingAssets/resetPassword.html"
  );
  const templateString = fs.readFileSync(filePath, "utf8");
  const emailContent = templateString
    .replace("${name}", user.name)
    .replace("${resetLink}", resetURL);
  const emailSent = await sendEmail(
    email,
    "Password Reset Request",
    emailContent
  );
  if (!emailSent) {
    return res.status(400).json({ message: "Invalid email" });
  }
  return res
    .status(200)
    .json({ message: "Password reset email sent successfully" });
};

const resetPassword = async (req, res, next) => {
  const resetToken = req.params.id;
  const { password } = req.body;
  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await checkIdExists(decoded.id);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    try {
      await user.save();
    } catch (saveError) {
      console.error("Error saving user:", saveError);
    }
    res.status(200).json({ message: "Password has been reset" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
