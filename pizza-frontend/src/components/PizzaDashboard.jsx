import React, { useEffect, useState } from "react";
import { getInventory } from "../services/inventoryService";

const PizzaDashboard = () => {
    const [inventory, setInventory] = useState({ base: [], sauce: [], cheese: [], veggie: [], meat: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const data = await getInventory();
                setInventory(data);
            } catch (error) {
                alert(error.message || "Failed to load pizza varieties");
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboard();
    }, []);

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
            <p>Available pizza ingredient varieties</p>
            <div className="dashboard-grid">
                <article className="dashboard-card">
                    <h3>Bases</h3>
                    <ul>
                        {inventory.base.map((item) => <li key={item._id}>{item.name}</li>)}
                    </ul>
                </article>
                <article className="dashboard-card">
                    <h3>Sauces</h3>
                    <ul>
                        {inventory.sauce.map((item) => <li key={item._id}>{item.name}</li>)}
                    </ul>
                </article>
                <article className="dashboard-card">
                    <h3>Cheese</h3>
                    <ul>
                        {inventory.cheese.map((item) => <li key={item._id}>{item.name}</li>)}
                    </ul>
                </article>
                <article className="dashboard-card">
                    <h3>Veggies</h3>
                    <ul>
                        {inventory.veggie.map((item) => <li key={item._id}>{item.name}</li>)}
                    </ul>
                </article>
                <article className="dashboard-card">
                    <h3>Meat</h3>
                    <ul>
                        {inventory.meat.map((item) => <li key={item._id}>{item.name}</li>)}
                    </ul>
                </article>
            </div>
        </section>
    );
};

export default PizzaDashboard;
