const express = require("express");
const router = express.Router();
const { protect, requireVerifiedUser } = require("../middleware/authMiddleware");
const { getUserProfile } = require("../controllers/userController");

router.get("/", protect, requireVerifiedUser, getUserProfile);

module.exports = router;
