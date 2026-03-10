const express = require("express");
const router = express.Router();
const {
	getInventory,
	seedInventory,
	createInventoryItem,
	updateInventoryItem,
	deleteInventoryItem,
} = require("../controllers/inventoryController");
const { protect, requireVerifiedUser, adminOnly } = require("../middleware/authMiddleware");

router.get("/", getInventory);
router.post("/seed", seedInventory);
router.post("/admin/item", protect, requireVerifiedUser, adminOnly, createInventoryItem);
router.patch("/admin/item/:id", protect, requireVerifiedUser, adminOnly, updateInventoryItem);
router.delete("/admin/item/:id", protect, requireVerifiedUser, adminOnly, deleteInventoryItem);

module.exports = router;
