const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const sendPasswordResetEmail = require("../utils/sendPasswordResetEmail");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const buildAuthPayload = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    isAdmin: user.isAdmin,
    role: user.role,
    isVerified: user.isVerified,
    token: generateToken(user._id),
});

const ensureValidRegistrationInput = ({ name, email, password }) => {
    if (!name || name.trim().length < 2) {
        return "Name must be at least 2 characters";
    }

    if (!EMAIL_REGEX.test(normalizeEmail(email))) {
        return "Please provide a valid email";
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }

    return null;
};

const issueVerificationToken = () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    return {
        rawToken,
        hashedToken,
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    };
};

const issueResetToken = () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    return {
        rawToken,
        hashedToken,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    };
};

const registerAccount = async (req, res, targetRole) => {
    try {
        const { name, email, password, phone, address, adminRegistrationSecret } = req.body;

        const validationError = ensureValidRegistrationInput({ name, email, password });

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const normalizedEmail = normalizeEmail(email);
        const userExists = await User.findOne({ email: normalizedEmail });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        if (
            targetRole === "admin" &&
            (!process.env.ADMIN_REGISTRATION_SECRET || adminRegistrationSecret !== process.env.ADMIN_REGISTRATION_SECRET)
        ) {
            return res.status(403).json({ message: "Invalid admin registration secret" });
        }

        const verificationToken = issueVerificationToken();

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            phone,
            address,
            role: targetRole,
            isAdmin: targetRole === "admin",
            isVerified: false,
            verificationToken: verificationToken.hashedToken,
            verificationTokenExpire: verificationToken.expiresAt,
        });

        const mailResult = await sendVerificationEmail(user.email, verificationToken.rawToken);

        return res.status(201).json({
            message: "Registration successful. Please verify your email before login.",
            email: user.email,
            role: user.role,
            requiresEmailVerification: true,
            ...(mailResult.previewUrl ? { verificationPreviewUrl: mailResult.previewUrl } : {}),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const loginAccount = async (req, res, requiredRole) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!EMAIL_REGEX.test(normalizedEmail) || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (requiredRole && user.role !== requiredRole) {
            return res.status(403).json({ message: `${requiredRole} login is required for this account` });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in" });
        }

        return res.status(200).json(buildAuthPayload(user));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/users/register/user
// @access  Public
const registerUser = async (req, res) => {
    return registerAccount(req, res, "user");
};

// @desc    Register a new admin
// @route   POST /api/users/register/admin
// @access  Public
const registerAdmin = async (req, res) => {
    return registerAccount(req, res, "admin");
};

// @desc    Verify user email
// @route   GET /api/users/verify-email/:token
// @access  Public
const verifyUserEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpire: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();

        return res.status(200).json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Resend verification email
// @route   POST /api/users/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const normalizedEmail = normalizeEmail(email);

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({ message: "Please provide a valid email" });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(200).json({ message: "If your account exists, a verification email has been sent" });
        }

        if (user.isVerified) {
            return res.status(200).json({ message: "User is already verified" });
        }

        const verificationToken = issueVerificationToken();
        user.verificationToken = verificationToken.hashedToken;
        user.verificationTokenExpire = verificationToken.expiresAt;
        await user.save();

        const mailResult = await sendVerificationEmail(user.email, verificationToken.rawToken);

        return res.status(200).json({
            message: "Verification email sent again",
            ...(mailResult.previewUrl ? { verificationPreviewUrl: mailResult.previewUrl } : {}),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Dev helper to verify email without SMTP
// @route   POST /api/users/dev/verify-email
// @access  Public (development only)
const devVerifyEmail = async (req, res) => {
    try {
        if (process.env.NODE_ENV === "production") {
            return res.status(403).json({ message: "Not available in production" });
        }

        const normalizedEmail = normalizeEmail(req.body.email);
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "No user found with this email" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();

        return res.status(200).json({ message: "User verified in development mode" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/users/login/user
// @access  Public
const loginUser = async (req, res) => {
    return loginAccount(req, res, "user");
};

// @desc    Login admin
// @route   POST /api/users/login/admin
// @access  Public
const loginAdmin = async (req, res) => {
    return loginAccount(req, res, "admin");
};

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const normalizedEmail = normalizeEmail(email);

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({ message: "Please provide a valid email" });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(200).json({ message: "If your account exists, a reset email has been sent" });
        }

        const resetToken = issueResetToken();

        user.resetPasswordToken = resetToken.hashedToken;
        user.resetPasswordExpire = resetToken.expiresAt;
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken.rawToken}`;
        const mailResult = await sendPasswordResetEmail(user.email, resetUrl);

        return res.status(200).json({
            message: "Password reset email sent",
            ...(mailResult.previewUrl ? { resetPreviewUrl: mailResult.previewUrl } : {}),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Reset password
// @route   POST /api/users/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        if (!password || password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
            });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return res.status(200).json({ message: "Password reset successful. Please login." });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get admin dashboard summary
// @route   GET /api/users/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
    return res.status(200).json({
        message: "Welcome admin",
        admin: req.user,
    });
};

// @desc    Get latest registered users (admin)
// @route   GET /api/users/admin/users
// @access  Private/Admin
const getAllUsersForAdmin = async (req, res) => {
    try {
        const parsedLimit = Number(req.query.limit);
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
            ? Math.min(Math.floor(parsedLimit), 200)
            : 50;

        const users = await User.find({})
            .select("-password -verificationToken -verificationTokenExpire -resetPasswordToken -resetPasswordExpire")
            .sort({ createdAt: -1 })
            .limit(limit);

        return res.status(200).json({
            count: users.length,
            users,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    return res.status(200).json(req.user);
};

module.exports = {
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
};
