const API_BASE_URL = "http://localhost:5000/api";

const parseApiResponse = async (response) => {
    const rawBody = await response.text();
    let data = null;

    try {
        data = rawBody ? JSON.parse(rawBody) : null;
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        const fallbackMessage = rawBody && rawBody.includes("<!DOCTYPE html")
            ? "Auth API is not reachable at http://localhost:5000/api. Start backend server and try again."
            : "Request failed";

        throw new Error((data && data.message) || fallbackMessage);
    }

    if (!data) {
        throw new Error("Invalid API response format");
    }

    return data;
};

const postJson = async (url, payload) => {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return parseApiResponse(response);
};

export const registerUser = async (payload) => {
    return postJson(`${API_BASE_URL}/users/register/user`, payload);
};

export const registerAdmin = async (payload) => {
    return postJson(`${API_BASE_URL}/users/register/admin`, payload);
};

export const loginUser = async (email, password) => {
    return postJson(`${API_BASE_URL}/users/login/user`, { email, password });
};

export const loginAdmin = async (email, password) => {
    return postJson(`${API_BASE_URL}/users/login/admin`, { email, password });
};

export const verifyEmail = async (token) => {
    const response = await fetch(`${API_BASE_URL}/users/verify-email/${token}`);
    return parseApiResponse(response);
};

export const forgotPassword = async (email) => {
    return postJson(`${API_BASE_URL}/users/forgot-password`, { email });
};

export const resendVerification = async (email) => {
    return postJson(`${API_BASE_URL}/users/resend-verification`, { email });
};

export const devVerifyEmail = async (email) => {
    return postJson(`${API_BASE_URL}/users/dev/verify-email`, { email });
};

export const resetPassword = async (token, password) => {
    return postJson(`${API_BASE_URL}/users/reset-password/${token}`, { password });
};

export const getUserProfile = async (token) => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return parseApiResponse(response);
};
