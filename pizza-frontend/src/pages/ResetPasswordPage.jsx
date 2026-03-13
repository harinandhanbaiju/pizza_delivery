import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authService";

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { token: paramToken } = useParams();
    const token = useMemo(() => searchParams.get("token") || paramToken || "", [searchParams, paramToken]);

    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setIsLoading(true);
            setErrorMessage("");
            setMessage("");

            if (!token) {
                throw new Error("Reset token is missing.");
            }

            const response = await resetPassword(token, password);
            setMessage(response.message || "Password reset successful.");
            setTimeout(() => navigate("/login", { replace: true }), 1200);
        } catch (error) {
            setErrorMessage(error.message || "Failed to reset password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-shell">
            <section className="auth-page-hero">
                <p className="auth-page-kicker">Pizza Delivery</p>
                <h1>Reset Password</h1>
                <p>Set a new password for your account.</p>
            </section>

            <form className="auth-panel" onSubmit={handleSubmit}>
                <h2>Reset Password</h2>
                {!token && <p className="auth-feedback auth-feedback-error">Token is missing in URL.</p>}
                {message && <p className="auth-feedback auth-feedback-success">{message}</p>}
                {errorMessage && <p className="auth-feedback auth-feedback-error">{errorMessage}</p>}
                <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
                <button type="submit" disabled={isLoading || !token}>
                    {isLoading ? "Updating..." : "Update Password"}
                </button>
                <p className="auth-mode-note">
                    Back to <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default ResetPasswordPage;
