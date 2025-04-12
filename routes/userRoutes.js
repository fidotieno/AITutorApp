const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getUserProfile,
  editUserProfile,
  getChildren,
  getUsersByRole,
} = require("../controllers/userController");

module.exports = (upload) => {
  router.get("/get-profile", protect, getUserProfile);
  router.put("/edit-profile", protect, upload.single("file"), editUserProfile);
  router.get("/children", protect, getChildren);
  router.get("/all", protect, getUsersByRole);

  return router;
};
