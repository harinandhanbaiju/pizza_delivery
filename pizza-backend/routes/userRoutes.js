const express = require("express");
const router = express.Router();
const {
	registerUser,
	registerAdmin,
	verifyUserEmail,
	resendVerification,
	loginUser,
	loginAdmin,
	loginAny,
	forgotPassword,
	resetPassword,
	getUserProfile,
	getAdminDashboard,
	getAllUsersForAdmin,
} = require("../controllers/userController");
const { protect, adminOnly, requireVerifiedUser } = require("../middleware/authMiddleware");

// Exact auth endpoints
router.post("/register", registerUser);
router.post("/login", loginAny);
router.get("/verify-email", verifyUserEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/register/user", registerUser);
router.post("/register/admin", registerAdmin);
router.post("/login/user", loginUser);
router.post("/login/admin", loginAdmin);

// Backwards-compatible aliases
router.post("/", registerUser);
router.post("/admin/login", loginAdmin);

router.post("/reset-password/:token", resetPassword);
router.post("/resend-verification", resendVerification);
router.get("/verify-email/:token", verifyUserEmail);

// Backwards-compatible alias
router.get("/verify/:token", verifyUserEmail);

router.get("/profile", protect, requireVerifiedUser, getUserProfile);
router.get("/admin/dashboard", protect, requireVerifiedUser, adminOnly, getAdminDashboard);
router.get("/admin/users", protect, requireVerifiedUser, adminOnly, getAllUsersForAdmin);

module.exports = router;
