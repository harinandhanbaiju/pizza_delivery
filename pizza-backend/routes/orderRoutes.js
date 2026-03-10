const express = require("express");
const router = express.Router();
const {
	createOrder,
	createRazorpayOrder,
	verifyRazorpayPayment,
	confirmTestPayment,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createOrder);
router.post("/create-razorpay-order", protect, createRazorpayOrder);
router.post("/verify-payment", protect, verifyRazorpayPayment);
router.post("/test/confirm-payment", protect, confirmTestPayment);

module.exports = router;
