const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Not authorized, token missing" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tokenType && decoded.tokenType !== "access") {
            return res.status(401).json({ message: "Not authorized, invalid token type" });
        }

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "Not authorized, user not found" });
        }

        if (decoded.role && decoded.role !== user.role) {
            return res.status(401).json({ message: "Not authorized, token role mismatch" });
        }

        req.user = user;
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};

const requireVerifiedUser = (req, res, next) => {
    if (!req.user?.isVerified) {
        return res.status(403).json({ message: "Please verify your email first" });
    }

    return next();
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "You are not allowed to access this resource" });
    }

    return next();
};

const adminOnly = authorizeRoles("admin");

module.exports = { protect, adminOnly, authorizeRoles, requireVerifiedUser };
