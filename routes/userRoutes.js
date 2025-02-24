const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getUserProfile,
  editUserProfile,
} = require("../controllers/userController");

module.exports = (upload) => {
  router.get("/get-profile", protect, getUserProfile);
  router.post("/edit-profile", protect, upload.single("file"), editUserProfile);

  return router;
};
