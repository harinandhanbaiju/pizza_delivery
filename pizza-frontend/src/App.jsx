import React from "react";
import PizzaBuilder from "./components/PizzaBuilder";
import { PizzaBuilderProvider } from "./context/PizzaBuilderContext";
import { AuthProvider } from "./context/AuthContext";
import AuthPanel from "./components/AuthPanel";
import PizzaDashboard from "./components/PizzaDashboard";
import { useAuth } from "./context/AuthContext";
import AdminInventoryManager from "./components/AdminInventoryManager";
import AdminOrderManager from "./components/AdminOrderManager";
import OvenRushHomeChrome from "./components/OvenRushHomeChrome";

const AuthPage = () => {
    return (
        <div className="auth-page-shell">
            <section className="auth-page-hero">
                <p className="auth-page-kicker">OvenRush</p>
                <h1>Login to continue your pizza journey</h1>
                <p>
                    Sign in to build custom pizzas, track ingredient stock, and place your order in minutes.
                </p>
            </section>
            <AuthPanel />
        </div>
    );
};

const AuthenticatedArea = () => {
    const { user, logout } = useAuth();

    if (!user) {
        return <AuthPage />;
    }

    return (
        <div className="app-shell">
            <section className="session-bar">
                <p>
                    Signed in as <strong>{user?.email}</strong>
                </p>
                <button type="button" className="session-logout" onClick={logout}>
                    Logout
                </button>
            </section>
            <OvenRushHomeChrome />
            <PizzaDashboard />
            {user?.role === "admin" && <AdminOrderManager />}
            {user?.role === "admin" && <AdminInventoryManager />}
            <PizzaBuilder />
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <PizzaBuilderProvider>
                <AuthenticatedArea />
            </PizzaBuilderProvider>
        </AuthProvider>
    );
};

export default App;
