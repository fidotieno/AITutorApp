const express = require("express");
const router = express.Router();
const { initiateStkPush, mpesaCallback } = require("../controllers/mpesaController");
const protect = require("../middleware/authMiddleware");

router.post("/stk-push", protect, initiateStkPush);
router.post("/callback", mpesaCallback);

module.exports = router;
