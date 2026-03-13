import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { Navigate, Route, Routes } from "react-router-dom";
import { PizzaBuilderProvider } from "./context/PizzaBuilderContext";
import ProtectedRoute from "./components/ProtectedRoute";
import WorkspaceShell from "./components/WorkspaceShell";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const RoleEntryRoute = ({ role }) => {
    const { user } = useAuth();

    if (!user) {
        return <LoginPage forcedRole={role} />;
    }

    if (role === "admin" && user.role !== "admin") {
        return <Navigate to="/user" replace />;
    }

    if (role === "user" && user.role === "admin") {
        return <Navigate to="/admin" replace />;
    }

    return <WorkspaceShell showAdminPanels={role === "admin"} />;
};

const App = () => {
    return (
        <AuthProvider>
            <PizzaBuilderProvider>
                <Routes>
                    <Route path="/" element={<Navigate to="/user" replace />} />
                    <Route path="/user" element={<RoleEntryRoute role="user" />} />
                    <Route path="/admin" element={<RoleEntryRoute role="admin" />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                    <Route
                        path="/dashboard"
                        element={(
                            <ProtectedRoute>
                                <WorkspaceShell />
                            </ProtectedRoute>
                        )}
                    />
                    <Route path="/admin-login" element={<Navigate to="/admin" replace />} />
                    <Route path="/dashboard/login" element={<Navigate to="/user" replace />} />
                    <Route path="*" element={<Navigate to="/user" replace />} />
                </Routes>
            </PizzaBuilderProvider>
        </AuthProvider>
    );
};

export default App;
