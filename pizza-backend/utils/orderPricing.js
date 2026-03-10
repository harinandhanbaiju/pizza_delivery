const Inventory = require("../models/Inventory");

const findInventoryItem = async (itemType, name) => {
    return Inventory.findOne({ itemType, name });
};

const getValidatedOrderPricing = async (pizzaConfig) => {
    const { base, sauce, cheese, veggies = [] } = pizzaConfig;

    if (!base || !sauce || !cheese) {
        throw new Error("Base, sauce and cheese are required");
    }

    const baseItem = await findInventoryItem("base", base);
    const sauceItem = await findInventoryItem("sauce", sauce);
    const cheeseItem = await findInventoryItem("cheese", cheese);

    if (!baseItem || !sauceItem || !cheeseItem) {
        throw new Error("One or more selected core ingredients are unavailable");
    }

    const veggieItems = await Inventory.find({
        itemType: "veggie",
        name: { $in: veggies },
    });

    if (veggies.length !== veggieItems.length) {
        throw new Error("One or more selected veggies are unavailable");
    }

    const allItems = [baseItem, sauceItem, cheeseItem, ...veggieItems];

    const outOfStockItem = allItems.find((item) => item.stockQuantity < 1);
    if (outOfStockItem) {
        throw new Error(`${outOfStockItem.name} is out of stock`);
    }

    const totalPrice = allItems.reduce((sum, item) => sum + item.price, 0);

    return { totalPrice, allItems };
};

const decrementInventoryForOrder = async (items) => {
    for (const item of items) {
        await Inventory.updateOne(
            { _id: item._id, stockQuantity: { $gt: 0 } },
            { $inc: { stockQuantity: -1 } }
        );
    }
};

module.exports = {
    getValidatedOrderPricing,
    decrementInventoryForOrder,
};
