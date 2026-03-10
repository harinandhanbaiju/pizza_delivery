import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const USER_STORAGE_KEY = "pizza_user";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem(USER_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    });

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
    };

    const value = useMemo(
        () => ({
            user,
            login,
            logout,
            token: user?.token || null,
        }),
        [user]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};
