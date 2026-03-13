import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../services/authService";

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const { token: paramToken } = useParams();
    const token = useMemo(() => searchParams.get("token") || paramToken || "", [searchParams, paramToken]);
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        const run = async () => {
            if (!token) {
                setStatus("error");
                setMessage("Verification token is missing.");
                return;
            }

            try {
                const response = await verifyEmail(token);
                setStatus("success");
                setMessage(response.message || "Email verified successfully.");
            } catch (error) {
                setStatus("error");
                setMessage(error.message || "Email verification failed.");
            }
        };

        run();
    }, [token]);

    return (
        <div className="auth-page-shell">
            <section className="auth-page-hero">
                <p className="auth-page-kicker">Pizza Delivery</p>
                <h1>Email Verification</h1>
                <p>Confirming your email token.</p>
            </section>

            <section className="auth-panel">
                <h2>Verification Status</h2>
                <p className={`auth-feedback ${status === "error" ? "auth-feedback-error" : "auth-feedback-success"}`}>
                    {message}
                </p>
                <p className="auth-mode-note">
                    Continue to <Link to="/login">Login</Link>
                </p>
            </section>
        </div>
    );
};

export default VerifyEmailPage;
