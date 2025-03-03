const { uploadFileToDropbox } = require("../utils/functions/dropboxUpload");

const getUserProfile = (req, res, next) => {
  const user = req.user;
  const { password, ...userWithoutPassword } = user.toObject();
  return res.status(200).json({ user: userWithoutPassword });
};

const editUserProfile = async (req, res, next) => {
  const user = req.user;
  const { name } = req.body;
  let fileData = "";
  if (req.file) {
    fileData = await uploadFileToDropbox(
      (baseDirectory = `ProfilePictures/${user._id}`),
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
  }
  if (!name) return res.status(422).json({ message: "Name not Provided!" });
  user.name = name || user.name;
  user.profilePhoto = fileData || user.profilePhoto;
  try {
    const updatedUser = await user.save();
    const { password, ...userWithoutPassword } = updatedUser.toObject();
    res
      .status(200)
      .json({ message: "Username updated successfully!", userWithoutPassword });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error updating user profile", error: err });
  }
};

module.exports = {
  getUserProfile,
  editUserProfile,
};
