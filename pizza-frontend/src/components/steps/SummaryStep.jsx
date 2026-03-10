import React from "react";
import { useState } from "react";
import { usePizzaBuilder } from "../../context/PizzaBuilderContext";
import {
    confirmTestPayment,
    createRazorpayOrder,
    verifyPayment,
} from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";

const SummaryStep = () => {
    const { pizzaData } = usePizzaBuilder();
    const { token, user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [estimatedTotal, setEstimatedTotal] = useState(null);
    const razorpayMode = (import.meta.env.VITE_RAZORPAY_MODE || "test").toLowerCase();
    const isTestMode = razorpayMode === "test";

    const handlePayNow = async () => {
        try {
            if (!token) {
                alert("Please login before placing an order");
                return;
            }

            setIsSubmitting(true);

            const paymentOrder = await createRazorpayOrder(pizzaData, token);
            setEstimatedTotal(paymentOrder.amount / 100);

            const handlePaymentSuccess = async (response = {}) => {
                if (response.razorpay_signature) {
                    return verifyPayment(
                        {
                            localOrderId: paymentOrder.localOrderId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        },
                        token
                    );
                }

                if (isTestMode) {
                    return confirmTestPayment(paymentOrder.localOrderId, token);
                }

                throw new Error("Payment success payload missing");
            };

            const options = {
                key: paymentOrder.razorpayKeyId,
                amount: paymentOrder.amount,
                currency: "INR",
                name: "Pizza Delivery",
                description: `Custom Pizza Order ${paymentOrder.localOrderId}`,
                order_id: paymentOrder.razorpayOrderId,
                handler: async function (response) {
                    try {
                        const result = await handlePaymentSuccess(response);
                        alert(result.message || "Payment successful. Order placed.");
                    } catch (error) {
                        alert(error.message || "Payment succeeded but order confirmation failed");
                    }
                },
                prefill: {
                    name: user?.name || "Test Customer",
                    email: user?.email || "success@razorpay.com",
                    contact: user?.phone || "9000090000",
                },
                notes: {
                    testMode: isTestMode ? "true" : "false",
                },
                modal: {
                    ondismiss: function () {
                        setIsSubmitting(false);
                    },
                },
                theme: {
                    color: "#c44536",
                },
            };

            if (paymentOrder.isMockOrder) {
                const result = await confirmTestPayment(paymentOrder.localOrderId, token);
                alert(result.message || "Test payment confirmed. Order placed.");
                return;
            }

            if (window.Razorpay) {
                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } else {
                if (isTestMode) {
                    const result = await confirmTestPayment(paymentOrder.localOrderId, token);
                    alert(result.message || "Test payment confirmed. Order placed.");
                } else {
                    alert("Razorpay checkout is not loaded.");
                }
            }
        } catch (error) {
            alert(error.message || "Failed to place order");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section>
            <h2>Step 5: Summary</h2>
            <p><strong>Base:</strong> {pizzaData.base}</p>
            <p><strong>Sauce:</strong> {pizzaData.sauce}</p>
            <p><strong>Cheese:</strong> {pizzaData.cheese}</p>
            <p><strong>Veggies:</strong> {pizzaData.veggies.length ? pizzaData.veggies.join(", ") : "None"}</p>
            <p><strong>Total:</strong> INR {estimatedTotal !== null ? estimatedTotal : "Calculated at checkout"}</p>
            <p><strong>Payment Mode:</strong> {isTestMode ? "Razorpay Test" : "Razorpay Live"}</p>
            <button type="button" onClick={handlePayNow} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Pay Now"}
            </button>
        </section>
    );
};

export default SummaryStep;
