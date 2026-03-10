const API_BASE_URL = "http://localhost:5000/api";

const getAuthHeaders = (token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

export const seedInventory = async () => {
    const response = await fetch(`${API_BASE_URL}/inventory/seed`, {
        method: "POST",
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to seed inventory");
    }

    return response.json();
};

export const getInventory = async () => {
    const response = await fetch(`${API_BASE_URL}/inventory`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch inventory");
    }

    return data;
};

export const createInventoryItem = async (payload, token) => {
    const response = await fetch(`${API_BASE_URL}/inventory/admin/item`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to create inventory item");
    }

    return data;
};

export const updateInventoryItem = async (id, payload, token) => {
    const response = await fetch(`${API_BASE_URL}/inventory/admin/item/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to update inventory item");
    }

    return data;
};

export const deleteInventoryItem = async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/inventory/admin/item/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to delete inventory item");
    }

    return data;
};
