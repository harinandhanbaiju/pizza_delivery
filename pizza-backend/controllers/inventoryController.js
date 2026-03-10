const Inventory = require("../models/Inventory");

const ALLOWED_ITEM_TYPES = ["base", "sauce", "cheese", "veggie", "meat"];

const normalizeItemType = (itemType = "") => itemType.trim().toLowerCase();

// @desc    Get grouped inventory by item type
// @route   GET /api/inventory
// @access  Public
const getInventory = async (req, res) => {
    try {
        const items = await Inventory.find({}).sort({ itemType: 1, name: 1 });

        const grouped = items.reduce(
            (acc, item) => {
                acc[item.itemType] = acc[item.itemType] || [];
                acc[item.itemType].push(item);
                return acc;
            },
            { base: [], sauce: [], cheese: [], veggie: [], meat: [] }
        );

        return res.status(200).json(grouped);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Seed starter inventory (idempotent)
// @route   POST /api/inventory/seed
// @access  Public (development helper)
const seedInventory = async (req, res) => {
    try {
        const defaults = [
            { itemType: "base", name: "Thin Crust", stockQuantity: 100, thresholdValue: 10, price: 120 },
            { itemType: "base", name: "Classic Pan", stockQuantity: 100, thresholdValue: 10, price: 140 },
            { itemType: "base", name: "Whole Wheat", stockQuantity: 80, thresholdValue: 10, price: 150 },
            { itemType: "base", name: "Cheese Burst", stockQuantity: 70, thresholdValue: 10, price: 170 },
            { itemType: "base", name: "Stuffed Crust", stockQuantity: 65, thresholdValue: 10, price: 180 },
            { itemType: "sauce", name: "Tomato Basil", stockQuantity: 120, thresholdValue: 15, price: 35 },
            { itemType: "sauce", name: "Spicy Arrabbiata", stockQuantity: 90, thresholdValue: 15, price: 45 },
            { itemType: "sauce", name: "Pesto", stockQuantity: 70, thresholdValue: 10, price: 50 },
            { itemType: "sauce", name: "Smoky BBQ", stockQuantity: 80, thresholdValue: 12, price: 55 },
            { itemType: "sauce", name: "Garlic Alfredo", stockQuantity: 75, thresholdValue: 12, price: 60 },
            { itemType: "cheese", name: "Mozzarella", stockQuantity: 120, thresholdValue: 20, price: 60 },
            { itemType: "cheese", name: "Cheddar", stockQuantity: 100, thresholdValue: 15, price: 65 },
            { itemType: "cheese", name: "Vegan Cheese", stockQuantity: 70, thresholdValue: 10, price: 80 },
            { itemType: "veggie", name: "Onion", stockQuantity: 200, thresholdValue: 30, price: 20 },
            { itemType: "veggie", name: "Capsicum", stockQuantity: 180, thresholdValue: 30, price: 20 },
            { itemType: "veggie", name: "Olives", stockQuantity: 140, thresholdValue: 20, price: 20 },
            { itemType: "veggie", name: "Mushroom", stockQuantity: 120, thresholdValue: 20, price: 20 },
            { itemType: "veggie", name: "Sweet Corn", stockQuantity: 160, thresholdValue: 20, price: 20 },
            { itemType: "veggie", name: "Jalapeno", stockQuantity: 130, thresholdValue: 20, price: 20 },
            { itemType: "meat", name: "Pepperoni", stockQuantity: 90, thresholdValue: 15, price: 70 },
            { itemType: "meat", name: "Chicken Sausage", stockQuantity: 90, thresholdValue: 15, price: 75 },
            { itemType: "meat", name: "Grilled Chicken", stockQuantity: 80, thresholdValue: 15, price: 80 },
        ];

        for (const item of defaults) {
            await Inventory.updateOne(
                { itemType: item.itemType, name: item.name },
                { $setOnInsert: item },
                { upsert: true }
            );
        }

        return res.status(200).json({ message: "Inventory seeded successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Add inventory item
// @route   POST /api/inventory/admin/item
// @access  Private/Admin
const createInventoryItem = async (req, res) => {
    try {
        const { itemType, name, stockQuantity, thresholdValue, price } = req.body;
        const normalizedType = normalizeItemType(itemType);

        if (!ALLOWED_ITEM_TYPES.includes(normalizedType)) {
            return res.status(400).json({ message: "Invalid itemType" });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Name is required" });
        }

        const item = await Inventory.create({
            itemType: normalizedType,
            name: name.trim(),
            stockQuantity: Number(stockQuantity),
            thresholdValue: Number(thresholdValue),
            price: Number(price),
        });

        return res.status(201).json(item);
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(400).json({ message: "This item already exists in inventory" });
        }

        return res.status(400).json({ message: error.message });
    }
};

// @desc    Update inventory item
// @route   PATCH /api/inventory/admin/item/:id
// @access  Private/Admin
const updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {};

        if (typeof req.body.name === "string" && req.body.name.trim()) {
            updates.name = req.body.name.trim();
        }

        if (typeof req.body.stockQuantity !== "undefined") {
            updates.stockQuantity = Number(req.body.stockQuantity);
        }

        if (typeof req.body.thresholdValue !== "undefined") {
            updates.thresholdValue = Number(req.body.thresholdValue);
        }

        if (typeof req.body.price !== "undefined") {
            updates.price = Number(req.body.price);
        }

        if (typeof req.body.itemType === "string") {
            const normalizedType = normalizeItemType(req.body.itemType);
            if (!ALLOWED_ITEM_TYPES.includes(normalizedType)) {
                return res.status(400).json({ message: "Invalid itemType" });
            }
            updates.itemType = normalizedType;
        }

        const item = await Inventory.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!item) {
            return res.status(404).json({ message: "Inventory item not found" });
        }

        return res.status(200).json(item);
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(400).json({ message: "This item already exists in inventory" });
        }

        return res.status(400).json({ message: error.message });
    }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/admin/item/:id
// @access  Private/Admin
const deleteInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Inventory.findByIdAndDelete(id);

        if (!item) {
            return res.status(404).json({ message: "Inventory item not found" });
        }

        return res.status(200).json({ message: "Inventory item deleted" });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getInventory,
    seedInventory,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
};
