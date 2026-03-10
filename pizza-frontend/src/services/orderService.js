const API_BASE_URL = "http://localhost:5000/api";

const getAuthHeaders = (token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export const createOrder = async (payload, token) => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
    }

    return response.json();
};

export const createRazorpayOrder = async (pizzaConfig, token) => {
    const response = await fetch(`${API_BASE_URL}/orders/create-razorpay-order`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ pizzaConfig }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to create payment order");
    }

    return data;
};

export const verifyPayment = async (payload, token) => {
    const response = await fetch(`${API_BASE_URL}/orders/verify-payment`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Payment verification failed");
    }

    return data;
};

export const confirmTestPayment = async (localOrderId, token) => {
    const response = await fetch(`${API_BASE_URL}/orders/test/confirm-payment`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ localOrderId }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Test payment confirmation failed");
    }

    return data;
};
