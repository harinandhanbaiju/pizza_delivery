import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (requiredRole && user.role !== requiredRole) {
        const redirectPath = user.role === "admin" ? "/admin" : "/dashboard";
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
