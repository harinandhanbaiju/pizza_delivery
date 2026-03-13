import React, { useEffect, useMemo, useState } from "react";
import {
    forgotPassword,
    loginAdmin,
    loginUser,
    registerAdmin,
    registerUser,
    resetPassword,
    verifyEmail,
} from "../services/authService";
import { useAuth } from "../context/AuthContext";

const AuthPanel = ({ initialMode = "user-login", hideModeSwitch = false, onLoginSuccess }) => {
    const { user, login, logout } = useAuth();
    const [mode, setMode] = useState(initialMode);
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

    useEffect(() => {
        const path = window.location.pathname;

        if (path.startsWith("/reset-password/")) {
            setMode("reset-password");
            return;
        }

        if (path.startsWith("/verify-email/")) {
            setMode("verify-email");
            return;
        }

        setMode(initialMode);
    }, [initialMode]);

    useEffect(() => {
        if (hideModeSwitch && mode !== "reset-password" && mode !== "verify-email") {
            setMode(initialMode);
        }
    }, [hideModeSwitch, initialMode, mode]);

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
    const isForgotMode = mode === "forgot-password";
    const isResetMode = mode === "reset-password";
    const isVerifyMode = mode === "verify-email";

    const linkLabel = useMemo(() => {
        if (!statusLink) {
            return "";
        }

        if (statusLink.includes("/reset-password/")) {
            return "Open reset link";
        }

        if (statusLink.includes("/verify-email/")) {
            return "Open verification link";
        }

        return "Open link";
    }, [statusLink]);

    const clearFeedback = () => {
        setErrorMessage("");
        setStatusMessage("");
        setStatusLink("");
    };

    const switchMode = (nextMode) => {
        clearFeedback();
        setMode(nextMode);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setIsLoading(true);
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

            if (onLoginSuccess) {
                onLoginSuccess(loggedInUser, mode);
            }
        } catch (error) {
            setErrorMessage(error.message || "Authentication request failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (user) {
        return (
            <section className="auth-panel auth-panel-logged-in">
                <p>Signed in as <strong>{user.email}</strong></p>
                <p>Role: <strong>{user.role || (user.isAdmin ? "admin" : "user")}</strong></p>
                <p>Status: <strong>{user.isVerified ? "Verified" : "Unverified"}</strong></p>
                <button type="button" onClick={logout}>Logout</button>
            </section>
        );
    }

    return (
        <form className="auth-panel" onSubmit={handleSubmit}>
            <h2>Authentication</h2>
            {!hideModeSwitch && (
                <div className="mode-switch">
                    <button type="button" className={mode === "user-login" ? "is-active" : ""} onClick={() => switchMode("user-login")}>User Login</button>
                    <button type="button" className={mode === "admin-login" ? "is-active" : ""} onClick={() => switchMode("admin-login")}>Admin Login</button>
                    <button type="button" className={mode === "user-register" ? "is-active" : ""} onClick={() => switchMode("user-register")}>User Register</button>
                    <button type="button" className={mode === "admin-register" ? "is-active" : ""} onClick={() => switchMode("admin-register")}>Admin Register</button>
                    <button type="button" className={mode === "forgot-password" ? "is-active" : ""} onClick={() => switchMode("forgot-password")}>Forgot</button>
                    <button type="button" className={mode === "reset-password" ? "is-active" : ""} onClick={() => switchMode("reset-password")}>Reset</button>
                </div>
            )}

            {statusMessage && <p className="auth-feedback auth-feedback-success">{statusMessage}</p>}
            {statusLink && (
                <p className="auth-feedback auth-feedback-link">
                    <a href={statusLink} target="_blank" rel="noreferrer">
                        {linkLabel}
                    </a>
                </p>
            )}
            {errorMessage && <p className="auth-feedback auth-feedback-error">{errorMessage}</p>}

            {isForgotMode && <p className="auth-mode-note">Enter your email to receive a reset link.</p>}

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
                required={!isResetMode && !isVerifyMode}
            />

            {isResetMode && (
                <input
                    type="text"
                    placeholder="Reset Token"
                    value={resetToken}
                    onChange={(event) => setResetToken(event.target.value)}
                    required
                />
            )}

            {!isForgotMode && !isVerifyMode && (
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
            )}

            <button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : isForgotMode ? "Send Reset Link" : isResetMode ? "Update Password" : "Submit"}
            </button>

            {isAdminMode && <p className="auth-mode-note">Admin mode is active.</p>}
        </form>
    );
};

export default AuthPanel;
