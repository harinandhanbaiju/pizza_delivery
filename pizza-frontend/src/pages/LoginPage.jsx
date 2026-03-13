import React, { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login, loginAdmin, loginUser, resendVerification } from "../services/authService";

const LoginPage = ({ forcedRole }) => {
    const { user, login: setAuthUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [statusLink, setStatusLink] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const fromPath = useMemo(() => {
        const from = location.state?.from;
        return typeof from === "string" && from.startsWith("/") ? from : "";
    }, [location.state]);

    if (user) {
        return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setIsLoading(true);
            setErrorMessage("");
            setStatusMessage("");
            setStatusLink("");

            let loggedInUser;

            if (forcedRole === "admin") {
                loggedInUser = await loginAdmin(email, password);
            } else if (forcedRole === "user") {
                loggedInUser = await loginUser(email, password);
            } else {
                loggedInUser = await login(email, password);
            }

            setAuthUser(loggedInUser);

            const fallbackPath = loggedInUser.role === "admin" ? "/admin" : "/user";
            navigate(fromPath || fallbackPath, { replace: true });
        } catch (error) {
            setErrorMessage(error.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        try {
            setErrorMessage("");
            setStatusMessage("");
            setStatusLink("");

            if (!email.trim()) {
                throw new Error("Enter your email first to resend verification.");
            }

            const response = await resendVerification(email);
            setStatusMessage(response.message || "Verification email sent.");
            setStatusLink(response.verificationPreviewUrl || "");
        } catch (error) {
            setErrorMessage(error.message || "Failed to send verification email.");
        }
    };

    return (
        <div className="auth-page-shell">
            <section className="auth-page-hero">
                <p className="auth-page-kicker">Pizza Delivery</p>
                <h1>{forcedRole === "admin" ? "Admin Login" : forcedRole === "user" ? "User Login" : "Login to your account"}</h1>
                <p>
                    {forcedRole === "admin"
                        ? "Sign in with your admin account to manage orders and inventory."
                        : "Sign in to build pizzas, place orders, and manage your account."}
                </p>
            </section>

            <form className="auth-panel" onSubmit={handleSubmit}>
                <h2>Login</h2>
                {statusMessage && <p className="auth-feedback auth-feedback-success">{statusMessage}</p>}
                {statusLink && (
                    <p className="auth-feedback auth-feedback-link">
                        <a href={statusLink} target="_blank" rel="noreferrer">Open verification link</a>
                    </p>
                )}
                {errorMessage && <p className="auth-feedback auth-feedback-error">{errorMessage}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Login"}
                </button>
                <p className="auth-mode-note">
                    New account? <Link to="/register">Register</Link>
                </p>
                <p className="auth-mode-note">
                    Forgot password? <Link to="/forgot-password">Reset it</Link>
                </p>
                <p className="auth-mode-note">
                    Email not verified? <button type="button" className="auth-inline-link" onClick={handleResendVerification}>Verify mail</button>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;
