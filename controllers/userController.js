const Parent = require("../models/parentModel");
const Student = require("../models/studentModel");
const Teacher = require("../models/teacherModel");
const { uploadFileToDropbox } = require("../utils/functions/dropboxUpload");

const getUsersByRole = async (req, res) => {
  const { role } = req.query;

  try {
    let users = [];

    switch (role.toLowerCase()) {
      case "parent":
        users = await Parent.find({}, "_id name email role");
        break;
      case "teacher":
        users = await Teacher.find({}, "_id name email role");
        break;
      case "admin":
        users = await Admin.find({}, "_id name email role");
        break;
      case "student":
        users = await Student.find({}, "_id name email role");
        break;
      default:
        return res.status(400).json({ message: "Invalid role" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users by role:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserProfile = (req, res, next) => {
  const user = req.user;
  const { password, ...userWithoutPassword } = user.toObject();
  return res.status(200).json({ user: userWithoutPassword });
};

const editUserProfile = async (req, res, next) => {
  const user = req.user;
  const { name, parentEmail1, parentEmail2 } = req.body;
  let fileData = "";

  if (req.file) {
    fileData = await uploadFileToDropbox(
      `ProfilePictures/${user._id}`,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
  }

  if (!name) return res.status(422).json({ message: "Name not provided!" });

  user.name = name || user.name;
  user.profilePhoto = fileData || user.profilePhoto;

  // Update parent emails only if the user is a student
  if (user.role === "student") {
    user.parentEmail1 = parentEmail1 || user.parentEmail1;
    user.parentEmail2 = parentEmail2 || user.parentEmail2;
  }

  try {
    const updatedUser = await user.save();
    const { password, ...userWithoutPassword } = updatedUser.toObject();
    res
      .status(200)
      .json({
        message: "Profile updated successfully!",
        user: userWithoutPassword,
      });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error updating user profile", error: err });
  }
};

const getChildren = async (req, res, next) => {
  try {
    const isParent = await Parent.findById(req.user._id);
    if (!isParent) {
      return res.status(403).json({ message: "Access denied" });
    }

    const children = await Student.find(
      { parentsEmail: req.user.email },
      "id name email profilePhoto"
    );

    res.status(200).json({ children });
  } catch (error) {
    res.status(500).json({ message: "Error fetching children", error });
  }
};

module.exports = {
  getUsersByRole,
  getUserProfile,
  editUserProfile,
  getChildren,
};
