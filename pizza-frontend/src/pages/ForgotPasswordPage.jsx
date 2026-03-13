import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [resetLink, setResetLink] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setIsLoading(true);
            setErrorMessage("");
            setMessage("");
            setResetLink("");

            const response = await forgotPassword(email);
            setMessage(response.message || "Password reset email sent.");
            setResetLink(response.resetPreviewUrl || "");
        } catch (error) {
            setErrorMessage(error.message || "Failed to send reset email.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-shell">
            <section className="auth-page-hero">
                <p className="auth-page-kicker">Pizza Delivery</p>
                <h1>Forgot Password</h1>
                <p>Enter your email to receive a reset link.</p>
            </section>

            <form className="auth-panel" onSubmit={handleSubmit}>
                <h2>Forgot Password</h2>
                {message && <p className="auth-feedback auth-feedback-success">{message}</p>}
                {resetLink && (
                    <p className="auth-feedback auth-feedback-link">
                        <a href={resetLink} target="_blank" rel="noreferrer">Open reset link</a>
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
                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
                <p className="auth-mode-note">
                    Back to <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default ForgotPasswordPage;
