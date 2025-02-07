const express = require("express");
const router = express.Router();
// const protect = require("../middleware/authMiddleware");
const {
  register,
  login,
  resetPassword,
  forgotPassword,
  // getUserProfile,
} = require("../controllers/authController");
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:id", resetPassword);
// router.get("/profile", protect, getUserProfile);
module.exports = router;
