import React, { useCallback, useEffect, useState } from "react";
import { getAdminOrders, updateOrderStatusByAdmin } from "../services/orderService";
import { useAuth } from "../context/AuthContext";

const AdminOrderManager = () => {
    const { token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statuses, setStatuses] = useState([
        "Order Received",
        "In the Kitchen",
        "Sent to Delivery",
    ]);
    const [isUpdatingId, setIsUpdatingId] = useState("");

    const loadOrders = useCallback(async ({ silent = false } = {}) => {
        try {
            const data = await getAdminOrders(token);
            setOrders(data.orders || []);
            if (Array.isArray(data.statuses) && data.statuses.length) {
                setStatuses(data.statuses);
            }
        } catch (error) {
            if (!silent) {
                alert(error.message || "Failed to load orders");
            }
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadOrders();

        const intervalId = setInterval(() => {
            loadOrders({ silent: true });
        }, 10000);

        return () => clearInterval(intervalId);
    }, [loadOrders]);

    const handleStatusChange = async (orderId, status) => {
        try {
            setIsUpdatingId(orderId);
            await updateOrderStatusByAdmin(orderId, status, token);
            await loadOrders({ silent: true });
        } catch (error) {
            alert(error.message || "Failed to update order status");
        } finally {
            setIsUpdatingId("");
        }
    };

    if (isLoading) {
        return (
            <section className="dashboard-shell">
                <h2>Admin Orders</h2>
                <p>Loading orders...</p>
            </section>
        );
    }

    return (
        <section className="dashboard-shell">
            <h2>Admin Orders</h2>
            <p>Update each pizza order status as it moves through your workflow.</p>

            <div className="inventory-table-wrap">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Pizza</th>
                            <th>Total</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Placed At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order._id}>
                                <td>{order._id.slice(-8)}</td>
                                <td>{order.userId?.email || "Unknown"}</td>
                                <td>
                                    {order.pizzaConfig?.base}, {order.pizzaConfig?.sauce}, {order.pizzaConfig?.cheese}
                                </td>
                                <td>INR {order.totalPrice}</td>
                                <td>{order.paymentStatus || "Pending"}</td>
                                <td>
                                    <select
                                        className="order-status-select"
                                        value={order.status || "Order Received"}
                                        onChange={(event) => handleStatusChange(order._id, event.target.value)}
                                        disabled={isUpdatingId === order._id}
                                    >
                                        {statuses.map((status) => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>{new Date(order.createdAt).toLocaleString()}</td>
                            </tr>
                        ))}
                        {!orders.length && (
                            <tr>
                                <td colSpan="7">No orders yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default AdminOrderManager;
