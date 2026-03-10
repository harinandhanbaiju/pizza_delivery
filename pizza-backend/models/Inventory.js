const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
        itemType: {
            type: String,
            enum: ["base", "sauce", "cheese", "veggie", "meat"],
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        stockQuantity: {
            type: Number,
            required: true,
            min: 0,
        },
        thresholdValue: {
            type: Number,
            required: true,
            min: 0,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        lowStockAlertSentAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

inventorySchema.index({ itemType: 1, name: 1 }, { unique: true });

const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;
