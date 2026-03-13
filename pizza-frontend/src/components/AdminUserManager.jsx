import React, { useCallback, useEffect, useState } from "react";
import { getAdminUsers } from "../services/authService";
import { useAuth } from "../context/AuthContext";

const AdminUserManager = () => {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadUsers = useCallback(async ({ silent = false } = {}) => {
        try {
            const data = await getAdminUsers(token, 200);
            setUsers(data.users || []);
        } catch (error) {
            if (!silent) {
                alert(error.message || "Failed to load users");
            }
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadUsers();

        const intervalId = setInterval(() => {
            loadUsers({ silent: true });
        }, 15000);

        return () => clearInterval(intervalId);
    }, [loadUsers]);

    if (isLoading) {
        return (
            <section className="dashboard-shell">
                <h2>Admin Users</h2>
                <p>Loading users...</p>
            </section>
        );
    }

    return (
        <section className="dashboard-shell">
            <h2>Admin Users</h2>
            <p>Manage registered users and admins.</p>

            <div className="inventory-table-wrap">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Verified</th>
                            <th>Created</th>
                            <th>Account</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((targetUser) => (
                            <tr key={targetUser._id}>
                                <td>{targetUser.name || "-"}</td>
                                <td>{targetUser.email}</td>
                                <td>{targetUser.role || (targetUser.isAdmin ? "admin" : "user")}</td>
                                <td>{targetUser.isVerified ? "Yes" : "No"}</td>
                                <td>{targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleString() : "-"}</td>
                                <td>
                                    {String(targetUser._id) === String(currentUser?._id) ? (
                                        <span className="admin-user-self-tag">Current account</span>
                                    ) : (
                                        <span className="admin-user-self-tag">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!users.length && (
                            <tr>
                                <td colSpan="6">No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default AdminUserManager;
