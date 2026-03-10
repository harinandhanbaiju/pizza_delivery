const Order = require("../models/Order");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const {
    getValidatedOrderPricing,
    decrementInventoryForOrder,
} = require("../utils/orderPricing");

const ORDER_STATUS = {
    ORDER_RECEIVED: "Order Received",
    IN_THE_KITCHEN: "In the Kitchen",
    SENT_TO_DELIVERY: "Sent to Delivery",
};

const STATUS_ALIASES = {
    "received": ORDER_STATUS.ORDER_RECEIVED,
    "order received": ORDER_STATUS.ORDER_RECEIVED,
    "in kitchen": ORDER_STATUS.IN_THE_KITCHEN,
    "in the kitchen": ORDER_STATUS.IN_THE_KITCHEN,
    "sent": ORDER_STATUS.SENT_TO_DELIVERY,
    "sent to delivery": ORDER_STATUS.SENT_TO_DELIVERY,
};

const normalizeStatusInput = (status = "") => {
    const normalized = String(status).trim().toLowerCase();
    return STATUS_ALIASES[normalized] || null;
};

const isRazorpayTestMode = () => {
    return (
        String(process.env.RAZORPAY_MODE || "").toLowerCase() === "test" ||
        String(process.env.RAZORPAY_TEST_MODE || "").toLowerCase() === "true"
    );
};

const getRazorpayClient = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required for payments");
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

const hasUsableRazorpayCredentials = () => {
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
        return false;
    }

    if (keyId.includes("your_key_id") || keySecret.includes("your_razorpay_key_secret")) {
        return false;
    }

    return true;
};

// @desc    Create a custom pizza order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { pizzaConfig, paymentStatus } = req.body;

        if (!pizzaConfig) {
            return res.status(400).json({ message: "pizzaConfig is required" });
        }

        const { base, sauce, cheese, veggies = [] } = pizzaConfig;

        if (!base || !sauce || !cheese) {
            return res.status(400).json({ message: "Base, sauce and cheese are required" });
        }

        const { totalPrice, allItems } = await getValidatedOrderPricing(pizzaConfig);

        const order = await Order.create({
            userId: req.user._id,
            pizzaConfig: {
                base,
                sauce,
                cheese,
                veggies,
            },
            totalPrice,
            paymentStatus: paymentStatus || "Pending",
        });

        if (order.paymentStatus === "Paid") {
            await decrementInventoryForOrder(allItems);
        }

        return res.status(201).json(order);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// @desc    Create Razorpay order for custom pizza
// @route   POST /api/orders/create-razorpay-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
    try {
        const { pizzaConfig } = req.body;

        if (!pizzaConfig) {
            return res.status(400).json({ message: "pizzaConfig is required" });
        }

        const { totalPrice } = await getValidatedOrderPricing(pizzaConfig);

        const localOrder = await Order.create({
            userId: req.user._id,
            pizzaConfig,
            totalPrice,
            paymentStatus: "Pending",
        });

        // In test mode, allow checkout flow without real Razorpay credentials.
        if (isRazorpayTestMode() && !hasUsableRazorpayCredentials()) {
            const mockOrderId = `order_test_${localOrder._id}`;
            localOrder.paymentGatewayOrderId = mockOrderId;
            await localOrder.save();

            return res.status(201).json({
                localOrderId: localOrder._id,
                amount: Math.round(totalPrice * 100),
                currency: "INR",
                razorpayOrderId: mockOrderId,
                razorpayKeyId: "rzp_test_mock_key",
                isMockOrder: true,
                message: "Created mock payment order in Razorpay test mode",
            });
        }

        const razorpay = getRazorpayClient();

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalPrice * 100),
            currency: "INR",
            receipt: `order_${localOrder._id}`,
            notes: {
                localOrderId: String(localOrder._id),
                userId: String(req.user._id),
            },
        });

        localOrder.paymentGatewayOrderId = razorpayOrder.id;
        await localOrder.save();

        return res.status(201).json({
            localOrderId: localOrder._id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            isMockOrder: false,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// @desc    Verify Razorpay payment and confirm order
// @route   POST /api/orders/verify-payment
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            localOrderId,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
        } = req.body;

        if (!localOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: "Payment verification fields are required" });
        }

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (generatedSignature !== razorpaySignature) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        const order = await Order.findOne({
            _id: localOrderId,
            userId: req.user._id,
            paymentGatewayOrderId: razorpayOrderId,
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.paymentStatus !== "Paid") {
            const { allItems } = await getValidatedOrderPricing(order.pizzaConfig);
            await decrementInventoryForOrder(allItems);
        }

        order.paymentStatus = "Paid";
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = razorpaySignature;
        await order.save();

        return res.status(200).json({ message: "Payment verified and order confirmed", order });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// @desc    Confirm payment in explicit test mode
// @route   POST /api/orders/test/confirm-payment
// @access  Private
const confirmTestPayment = async (req, res) => {
    try {
        if (!isRazorpayTestMode()) {
            return res.status(403).json({ message: "Test payment confirmation is disabled" });
        }

        const { localOrderId } = req.body;

        if (!localOrderId) {
            return res.status(400).json({ message: "localOrderId is required" });
        }

        const order = await Order.findOne({
            _id: localOrderId,
            userId: req.user._id,
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.paymentStatus !== "Paid") {
            const { allItems } = await getValidatedOrderPricing(order.pizzaConfig);
            await decrementInventoryForOrder(allItems);

            order.paymentStatus = "Paid";
            order.razorpayPaymentId = `testpay_${Date.now()}`;
            order.razorpaySignature = "test-mode-confirmed";
            await order.save();
        }

        return res.status(200).json({
            message: "Test payment confirmed and order placed",
            order,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });

        return res.status(200).json({
            count: orders.length,
            orders,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders for admin
// @route   GET /api/orders/admin
// @access  Private/Admin
const getOrdersForAdmin = async (req, res) => {
    try {
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .populate("userId", "name email");

        return res.status(200).json({
            count: orders.length,
            orders,
            statuses: Object.values(ORDER_STATUS),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status by admin
// @route   PATCH /api/orders/admin/:id/status
// @access  Private/Admin
const updateOrderStatusByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const canonicalStatus = normalizeStatusInput(req.body.status);

        if (!canonicalStatus) {
            return res.status(400).json({
                message: "Invalid status. Allowed values: Order Received, In the Kitchen, Sent to Delivery",
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { status: canonicalStatus },
            { new: true, runValidators: true }
        ).populate("userId", "name email");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({
            message: "Order status updated",
            order,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    createRazorpayOrder,
    verifyRazorpayPayment,
    confirmTestPayment,
    getMyOrders,
    getOrdersForAdmin,
    updateOrderStatusByAdmin,
};
