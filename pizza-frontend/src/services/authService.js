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
        const hasHtmlBody = rawBody && rawBody.includes("<!DOCTYPE html");
        const routeMissingText = typeof rawBody === "string" && rawBody.includes("Cannot ");

        if (hasHtmlBody || routeMissingText) {
            throw new Error("API route not found on backend. Restart backend server and try again.");
        }

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
    let response;

    try {
        response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        throw new Error("Backend server is not reachable at http://localhost:5000. Start backend and try again.");
    }

    return parseApiResponse(response);
};

export const registerUser = async (payload) => {
    return postJson(`${API_BASE_URL}/auth/register`, payload);
};

export const registerAdmin = async (payload) => {
    return postJson(`${API_BASE_URL}/users/register/admin`, payload);
};

export const loginUser = async (email, password) => {
    return postJson(`${API_BASE_URL}/auth/login`, { email, password });
};

export const loginAdmin = async (email, password) => {
    return postJson(`${API_BASE_URL}/users/login/admin`, { email, password });
};

export const register = async (payload) => {
    return postJson(`${API_BASE_URL}/auth/register`, payload);
};

export const login = async (email, password) => {
    return postJson(`${API_BASE_URL}/auth/login`, { email, password });
};

export const verifyEmail = async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
    return parseApiResponse(response);
};

export const forgotPassword = async (email) => {
    return postJson(`${API_BASE_URL}/auth/forgot-password`, { email });
};

export const resendVerification = async (email) => {
    return postJson(`${API_BASE_URL}/users/resend-verification`, { email });
};

export const resetPassword = async (token, password) => {
    return postJson(`${API_BASE_URL}/auth/reset-password`, { token, password });
};

export const getUserProfile = async (token) => {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        throw new Error("Backend server is not reachable at http://localhost:5000. Start backend and try again.");
    }

    return parseApiResponse(response);
};

export const getAdminUsers = async (token, limit = 100) => {
    const endpoints = [
        `${API_BASE_URL}/admin/users?limit=${encodeURIComponent(limit)}`,
        `${API_BASE_URL}/users/admin/users?limit=${encodeURIComponent(limit)}`,
    ];

    for (let i = 0; i < endpoints.length; i += 1) {
        const endpoint = endpoints[i];
        try {
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            return await parseApiResponse(response);
        } catch (error) {
            if (i === endpoints.length - 1) {
                throw error;
            }
        }
    }

    throw new Error("Failed to load admin users");
};
