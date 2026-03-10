import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getInventory } from "../services/inventoryService";
import { getMyOrders } from "../services/orderService";
import { useAuth } from "../context/AuthContext";

const PizzaDashboard = () => {
    const { user, token } = useAuth();
    const [inventory, setInventory] = useState({ base: [], sauce: [], cheese: [], veggie: [], meat: [] });
    const [myOrders, setMyOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadDashboard = useCallback(async ({ silent = false } = {}) => {
        try {
            const [inventoryData, myOrdersData] = await Promise.all([
                getInventory(),
                token ? getMyOrders(token) : Promise.resolve({ orders: [] }),
            ]);

            setInventory({
                base: inventoryData.base || [],
                sauce: inventoryData.sauce || [],
                cheese: inventoryData.cheese || [],
                veggie: inventoryData.veggie || [],
                meat: inventoryData.meat || [],
            });
            setMyOrders(myOrdersData.orders || []);
            setLastUpdated(new Date());
        } catch (error) {
            if (!silent) {
                alert(error.message || "Failed to load pizza varieties");
            }
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadDashboard();

        // Keep admin stock view up to date when orders are placed.
        const intervalId = setInterval(() => {
            loadDashboard({ silent: true });
        }, 10000);

        return () => clearInterval(intervalId);
    }, [loadDashboard]);

    const lowStockItems = useMemo(() => {
        return [
            ...inventory.base,
            ...inventory.sauce,
            ...inventory.cheese,
            ...inventory.veggie,
            ...inventory.meat,
        ].filter((item) => Number(item.stockQuantity) <= Number(item.thresholdValue));
    }, [inventory]);

    const showAdminStock = user?.role === "admin";

    if (isLoading) {
        return (
            <section className="dashboard-shell">
                <h2>Pizza Dashboard</h2>
                <p>Loading varieties...</p>
            </section>
        );
    }

    return (
        <section className="dashboard-shell">
            <h2>Pizza Dashboard</h2>
            <p>
                Available pizza ingredient varieties
                {lastUpdated ? ` (Last updated: ${lastUpdated.toLocaleTimeString()})` : ""}
            </p>
            {showAdminStock && (
                <p>
                    Low stock items: <strong>{lowStockItems.length}</strong>
                </p>
            )}
            <div className="dashboard-grid">
                <article className="dashboard-card">
                    <h3>Bases</h3>
                    <ul>
                        {inventory.base.map((item) => (
                            <li key={item._id}>
                                {item.name}
                                {showAdminStock ? ` - Stock ${item.stockQuantity}` : ""}
                            </li>
                        ))}
                    </ul>
                </article>
                <article className="dashboard-card">
                    <h3>Sauces</h3>
                    <ul>
                        {inventory.sauce.map((item) => (
                            <li key={item._id}>
                                {item.name}
                                {showAdminStock ? ` - Stock ${item.stockQuantity}` : ""}
                            </li>
                        ))}
                    </ul>
                </article>
                <article className="dashboard-card">
                    <h3>Cheese</h3>
                    <ul>
                        {inventory.cheese.map((item) => (
                            <li key={item._id}>
                                {item.name}
                                {showAdminStock ? ` - Stock ${item.stockQuantity}` : ""}
                            </li>
                        ))}
                    </ul>
                </article>
                <article className="dashboard-card">
                    <h3>Veggies</h3>
                    <ul>
                        {inventory.veggie.map((item) => (
                            <li key={item._id}>
                                {item.name}
                                {showAdminStock ? ` - Stock ${item.stockQuantity}` : ""}
                            </li>
                        ))}
                    </ul>
                </article>
                <article className="dashboard-card">
                    <h3>Meat</h3>
                    <ul>
                        {inventory.meat.map((item) => (
                            <li key={item._id}>
                                {item.name}
                                {showAdminStock ? ` - Stock ${item.stockQuantity}` : ""}
                            </li>
                        ))}
                    </ul>
                </article>
            </div>

            <article className="dashboard-card user-orders-card">
                <h3>My Orders</h3>
                {!myOrders.length && <p>No orders yet. Place your first custom pizza.</p>}
                {myOrders.length > 0 && (
                    <ul className="user-orders-list">
                        {myOrders.map((order) => (
                            <li key={order._id}>
                                <strong>#{order._id.slice(-8)}</strong>
                                <span>{order.pizzaConfig?.base} / {order.pizzaConfig?.sauce} / {order.pizzaConfig?.cheese}</span>
                                <span>Status: <b>{order.status || "Order Received"}</b></span>
                                <span>Payment: {order.paymentStatus || "Pending"}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </article>
        </section>
    );
};

export default PizzaDashboard;
