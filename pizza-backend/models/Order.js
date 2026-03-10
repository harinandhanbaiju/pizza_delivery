const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        pizzaConfig: {
            base: { type: String, required: true },
            sauce: { type: String, required: true },
            cheese: { type: String, required: true },
            veggies: {
                type: [String],
                default: [],
            },
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["Received", "In Kitchen", "Sent"],
            default: "Received",
        },
        paymentStatus: {
            type: String,
            default: "Pending",
        },
        paymentGatewayOrderId: {
            type: String,
        },
        razorpayPaymentId: {
            type: String,
        },
        razorpaySignature: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
