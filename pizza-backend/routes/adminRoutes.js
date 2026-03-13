const express = require("express");
const router = express.Router();
const { protect, requireVerifiedUser, adminOnly } = require("../middleware/authMiddleware");
const {
	getAdminDashboard,
	getAllUsersForAdmin,
} = require("../controllers/userController");

router.get("/", protect, requireVerifiedUser, adminOnly, getAdminDashboard);
router.get("/users", protect, requireVerifiedUser, adminOnly, getAllUsersForAdmin);

module.exports = router;
