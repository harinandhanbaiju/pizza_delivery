import React, { useEffect, useMemo, useState } from "react";
import {
    createInventoryItem,
    deleteInventoryItem,
    getInventory,
    updateInventoryItem,
} from "../services/inventoryService";
import { useAuth } from "../context/AuthContext";

const ITEM_TYPES = ["base", "sauce", "cheese", "veggie", "meat"];

const AdminInventoryManager = () => {
    const { token } = useAuth();
    const [inventory, setInventory] = useState({
        base: [],
        sauce: [],
        cheese: [],
        veggie: [],
        meat: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newItem, setNewItem] = useState({
        itemType: "base",
        name: "",
        stockQuantity: 0,
        thresholdValue: 0,
        price: 0,
    });

    const loadInventory = async () => {
        try {
            const data = await getInventory();
            setInventory({
                base: data.base || [],
                sauce: data.sauce || [],
                cheese: data.cheese || [],
                veggie: data.veggie || [],
                meat: data.meat || [],
            });
        } catch (error) {
            alert(error.message || "Failed to load inventory");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const allItems = useMemo(() => {
        return ITEM_TYPES.flatMap((type) => (inventory[type] || []).map((item) => ({ ...item, itemType: type })));
    }, [inventory]);

    const handleCreate = async (event) => {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            await createInventoryItem(newItem, token);
            setNewItem({
                itemType: "base",
                name: "",
                stockQuantity: 0,
                thresholdValue: 0,
                price: 0,
            });
            await loadInventory();
        } catch (error) {
            alert(error.message || "Failed to add inventory item");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickStockUpdate = async (item, delta) => {
        try {
            const nextStock = Math.max(0, Number(item.stockQuantity || 0) + delta);
            await updateInventoryItem(
                item._id,
                {
                    stockQuantity: nextStock,
                },
                token
            );
            await loadInventory();
        } catch (error) {
            alert(error.message || "Failed to update stock");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteInventoryItem(id, token);
            await loadInventory();
        } catch (error) {
            alert(error.message || "Failed to delete inventory item");
        }
    };

    if (isLoading) {
        return (
            <section className="dashboard-shell">
                <h2>Admin Inventory</h2>
                <p>Loading inventory...</p>
            </section>
        );
    }

    return (
        <section className="dashboard-shell">
            <h2>Admin Inventory</h2>
            <p>Track stock for bases, sauces, cheese, veggies, and meat.</p>

            <form className="inventory-form" onSubmit={handleCreate}>
                <select
                    value={newItem.itemType}
                    onChange={(event) => setNewItem((prev) => ({ ...prev, itemType: event.target.value }))}
                >
                    {ITEM_TYPES.map((type) => (
                        <option value={type} key={type}>{type}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Item name"
                    value={newItem.name}
                    onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
                    required
                />
                <input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={newItem.stockQuantity}
                    onChange={(event) => setNewItem((prev) => ({ ...prev, stockQuantity: Number(event.target.value) }))}
                    required
                />
                <input
                    type="number"
                    min="0"
                    placeholder="Threshold"
                    value={newItem.thresholdValue}
                    onChange={(event) => setNewItem((prev) => ({ ...prev, thresholdValue: Number(event.target.value) }))}
                    required
                />
                <input
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={newItem.price}
                    onChange={(event) => setNewItem((prev) => ({ ...prev, price: Number(event.target.value) }))}
                    required
                />
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Item"}
                </button>
            </form>

            <div className="inventory-table-wrap">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Name</th>
                            <th>Stock</th>
                            <th>Threshold</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allItems.map((item) => (
                            <tr key={item._id}>
                                <td>{item.itemType}</td>
                                <td>{item.name}</td>
                                <td>{item.stockQuantity}</td>
                                <td>{item.thresholdValue}</td>
                                <td>{item.price}</td>
                                <td>
                                    <button type="button" onClick={() => handleQuickStockUpdate(item, 1)}>+1</button>
                                    <button type="button" onClick={() => handleQuickStockUpdate(item, -1)}>-1</button>
                                    <button type="button" onClick={() => handleDelete(item._id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default AdminInventoryManager;
