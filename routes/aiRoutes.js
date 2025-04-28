const express = require("express");
const { studyAssistant } = require("../controllers/aiController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/study-assistant", protect, studyAssistant);


module.exports = router;
