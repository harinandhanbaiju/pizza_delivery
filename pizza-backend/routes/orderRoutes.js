const express = require("express");
const router = express.Router();
const {
	createOrder,
	createRazorpayOrder,
	verifyRazorpayPayment,
	confirmTestPayment,
	getMyOrders,
	getOrdersForAdmin,
	updateOrderStatusByAdmin,
} = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);
router.post("/create-razorpay-order", protect, createRazorpayOrder);
router.post("/verify-payment", protect, verifyRazorpayPayment);
router.post("/test/confirm-payment", protect, confirmTestPayment);
router.get("/admin", protect, adminOnly, getOrdersForAdmin);
router.patch("/admin/:id/status", protect, adminOnly, updateOrderStatusByAdmin);

module.exports = router;
