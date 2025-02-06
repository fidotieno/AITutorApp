const Student = require("../../models/studentModel");
const Teacher = require("../../models/teacherModel");
const Admin = require("../../models/adminModel");
const Parent = require("../../models/parentModel");

const checkEmailExists = async (email) => {
  const student = await Student.findOne({ email });
  const teacher = await Teacher.findOne({ email });
  const admin = await Admin.findOne({ email });
  const parent = await Parent.findOne({ email });
  return student || teacher || admin || parent;
};

const createUser = async (Model, role, email, name, hashedPassword, res) => {
  const userExists = await checkEmailExists(email);
  if (userExists)
    return res.status(400).json({ message: "Email already exists" });
  const user = await Model.create({
    name: name,
    role: role,
    email: email,
    password: hashedPassword,
  });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Could not create user with the given data." });
  }

  return res.status(201).json({ message: "User created successfully!" });
};

module.exports = {
  createUser,
  checkEmailExists,
}