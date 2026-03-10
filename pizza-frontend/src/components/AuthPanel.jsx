import React, { useEffect, useMemo, useState } from "react";
import {
    forgotPassword,
    devVerifyEmail,
    loginAdmin,
    loginUser,
    registerAdmin,
    registerUser,
    resendVerification,
    resetPassword,
    verifyEmail,
} from "../services/authService";
import { useAuth } from "../context/AuthContext";

const AuthPanel = () => {
    const { user, login, logout } = useAuth();
    const [mode, setMode] = useState("user-login");
    const [statusMessage, setStatusMessage] = useState("");
    const [statusLink, setStatusLink] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [adminRegistrationSecret, setAdminRegistrationSecret] = useState("");
    const [resetToken, setResetToken] = useState(() => {
        const path = window.location.pathname;
        if (path.startsWith("/reset-password/")) {
            return path.split("/reset-password/")[1] || "";
        }
        return "";
    });
    const [verificationToken, setVerificationToken] = useState(() => {
        const path = window.location.pathname;
        if (path.startsWith("/verify-email/")) {
            return path.split("/verify-email/")[1] || "";
        }
        return "";
    });
    const [isLoading, setIsLoading] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);

    useEffect(() => {
        const path = window.location.pathname;

        if (path.startsWith("/reset-password/")) {
            setMode("reset-password");
            return;
        }

        if (path.startsWith("/verify-email/")) {
            setMode("verify-email");
        }
    }, []);

    useEffect(() => {
        const verifyFromUrl = async () => {
            if (mode !== "verify-email" || !verificationToken) {
                return;
            }

            try {
                setIsLoading(true);
                setErrorMessage("");
                const response = await verifyEmail(verificationToken);
                setStatusMessage(response.message || "Email verified successfully. Please login.");
                setMode("user-login");
            } catch (error) {
                setErrorMessage(error.message || "Email verification failed");
            } finally {
                setIsLoading(false);
            }
        };

        verifyFromUrl();
    }, [mode, verificationToken]);

    const isAdminMode = useMemo(
        () => mode === "admin-login" || mode === "admin-register",
        [mode]
    );

    const clearFeedback = () => {
        setErrorMessage("");
        setStatusMessage("");
        setStatusLink("");
    };

    const switchMode = (nextMode) => {
        clearFeedback();
        setNeedsVerification(false);
        setMode(nextMode);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setIsLoading(true);
            setNeedsVerification(false);
            clearFeedback();

            if (mode === "user-register" || mode === "admin-register") {
                const registerApi = mode === "admin-register" ? registerAdmin : registerUser;
                const response = await registerApi({
                    name,
                    email,
                    password,
                    phone,
                    address,
                    adminRegistrationSecret,
                });

                setStatusMessage(response.message || "Registration successful. Please verify your email.");

                if (response.verificationPreviewUrl) {
                    setStatusMessage(response.message || "Registration successful. Please verify your email.");
                    setStatusLink(response.verificationPreviewUrl);
                }

                setMode(mode === "admin-register" ? "admin-login" : "user-login");
                return;
            }

            if (mode === "forgot-password") {
                const response = await forgotPassword(email);
                setStatusMessage(response.message || "Password reset email sent");

                if (response.resetPreviewUrl) {
                    setStatusMessage(response.message || "Password reset email sent");
                    setStatusLink(response.resetPreviewUrl);
                }
                return;
            }

            if (mode === "reset-password") {
                const response = await resetPassword(resetToken, password);
                setStatusMessage(response.message || "Password reset successful");
                setMode("user-login");
                setPassword("");
                return;
            }

            if (mode === "verify-email") {
                return;
            }

            const loginApi = mode === "admin-login" ? loginAdmin : loginUser;
            const loggedInUser = await loginApi(email, password);
            login(loggedInUser);
            setStatusMessage("Login successful");
            setPassword("");
        } catch (error) {
            if ((error.message || "").toLowerCase().includes("verify your email")) {
                setNeedsVerification(true);
            }
            setErrorMessage(error.message || "Authentication request failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        try {
            setIsLoading(true);
            clearFeedback();
            const response = await resendVerification(email);
            setStatusMessage(response.message || "Verification email sent");

            if (response.verificationPreviewUrl) {
                setStatusMessage(response.message || "Verification email sent");
                setStatusLink(response.verificationPreviewUrl);
            }
        } catch (error) {
            setErrorMessage(error.message || "Failed to resend verification email");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDevVerify = async () => {
        try {
            setIsLoading(true);
            clearFeedback();
            const response = await devVerifyEmail(email);
            setStatusMessage(response.message || "Account verified in development mode");
            setNeedsVerification(false);
        } catch (error) {
            setErrorMessage(error.message || "Failed to verify in development mode");
        } finally {
            setIsLoading(false);
        }
    };

    if (user) {
        return (
            <section className="auth-panel">
                <p>Signed in as <strong>{user.email}</strong></p>
                <p>Role: <strong>{user.role || (user.isAdmin ? "admin" : "user")}</strong></p>
                <p>Status: <strong>{user.isVerified ? "Verified" : "Unverified"}</strong></p>
                <button type="button" onClick={logout}>Logout</button>
            </section>
        );
    }

    if (mode === "verify-email") {
        return (
            <section className="auth-panel">
                <h2>Email Verification</h2>
                {statusMessage && <p>{statusMessage}</p>}
                {errorMessage && <p>{errorMessage}</p>}
                {!statusMessage && !errorMessage && <p>Verifying your email...</p>}
                <button type="button" onClick={() => switchMode("user-login")}>Back to Login</button>
            </section>
        );
    }

    return (
        <form className="auth-panel" onSubmit={handleSubmit}>
            <h2>Authentication</h2>
            <div className="mode-switch">
                <button type="button" onClick={() => switchMode("user-login")}>User Login</button>
                <button type="button" onClick={() => switchMode("admin-login")}>Admin Login</button>
                <button type="button" onClick={() => switchMode("user-register")}>User Register</button>
                <button type="button" onClick={() => switchMode("admin-register")}>Admin Register</button>
                <button type="button" onClick={() => switchMode("forgot-password")}>Forgot</button>
                <button type="button" onClick={() => switchMode("reset-password")}>Reset</button>
            </div>

            {statusMessage && <p>{statusMessage}</p>}
            {statusLink && (
                <p>
                    <a href={statusLink} target="_blank" rel="noreferrer">
                        Open link
                    </a>
                </p>
            )}
            {errorMessage && <p>{errorMessage}</p>}

            {(mode === "user-register" || mode === "admin-register") && (
                <>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Phone"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Address"
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                    />
                    {mode === "admin-register" && (
                        <input
                            type="text"
                            placeholder="Admin Registration Secret"
                            value={adminRegistrationSecret}
                            onChange={(event) => setAdminRegistrationSecret(event.target.value)}
                            required
                        />
                    )}
                </>
            )}

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required={mode !== "reset-password" && mode !== "verify-email"}
            />

            {mode === "reset-password" && (
                <input
                    type="text"
                    placeholder="Reset Token"
                    value={resetToken}
                    onChange={(event) => setResetToken(event.target.value)}
                    required
                />
            )}

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required={mode !== "forgot-password" && mode !== "verify-email"}
            />

            <button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Submit"}
            </button>

            {needsVerification && (
                <div className="verify-actions">
                    <button type="button" onClick={handleResendVerification} disabled={isLoading}>
                        Resend Verification Email
                    </button>
                    <button type="button" onClick={handleDevVerify} disabled={isLoading}>
                        Verify (Dev Only)
                    </button>
                </div>
            )}

            {isAdminMode && <p>Admin mode is active.</p>}
        </form>
    );
};

export default AuthPanel;
