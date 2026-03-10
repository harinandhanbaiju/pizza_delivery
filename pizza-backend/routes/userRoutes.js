const express = require("express");
const router = express.Router();
const {
	registerUser,
	registerAdmin,
	verifyUserEmail,
	resendVerification,
	devVerifyEmail,
	loginUser,
	loginAdmin,
	forgotPassword,
	resetPassword,
	getUserProfile,
	getAdminDashboard,
	getAllUsersForAdmin,
} = require("../controllers/userController");
const { protect, adminOnly, requireVerifiedUser } = require("../middleware/authMiddleware");

router.post("/register/user", registerUser);
router.post("/register/admin", registerAdmin);
router.post("/login/user", loginUser);
router.post("/login/admin", loginAdmin);

// Backwards-compatible aliases
router.post("/", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/resend-verification", resendVerification);
router.post("/dev/verify-email", devVerifyEmail);
router.get("/verify-email/:token", verifyUserEmail);

// Backwards-compatible alias
router.get("/verify/:token", verifyUserEmail);

router.get("/profile", protect, requireVerifiedUser, getUserProfile);
router.get("/admin/dashboard", protect, requireVerifiedUser, adminOnly, getAdminDashboard);
router.get("/admin/users", protect, requireVerifiedUser, adminOnly, getAllUsersForAdmin);

module.exports = router;
