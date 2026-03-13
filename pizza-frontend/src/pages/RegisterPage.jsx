import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";

const RegisterPage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [statusLink, setStatusLink] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setIsLoading(true);
            setErrorMessage("");
            setStatusMessage("");
            setStatusLink("");

            const response = await register({ name, email, password });
            setStatusMessage(response.message || "Registration successful. Please verify your email.");
            setStatusLink(response.verificationPreviewUrl || "");

            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1500);
        } catch (error) {
            setErrorMessage(error.message || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-shell">
            <section className="auth-page-hero">
                <p className="auth-page-kicker">Pizza Delivery</p>
                <h1>Create your account</h1>
                <p>Register, verify your email, and start ordering custom pizzas.</p>
            </section>

            <form className="auth-panel" onSubmit={handleSubmit}>
                <h2>Register</h2>
                {statusMessage && <p className="auth-feedback auth-feedback-success">{statusMessage}</p>}
                {statusLink && (
                    <p className="auth-feedback auth-feedback-link">
                        <a href={statusLink} target="_blank" rel="noreferrer">Open verification link</a>
                    </p>
                )}
                {errorMessage && <p className="auth-feedback auth-feedback-error">{errorMessage}</p>}

                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                />
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
                    {isLoading ? "Registering..." : "Register"}
                </button>
                <p className="auth-mode-note">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;
