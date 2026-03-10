const Inventory = require("../models/Inventory");
const User = require("../models/User");
const sendLowStockAlertEmail = require("../utils/sendLowStockAlertEmail");

const parsePositiveInt = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.floor(parsed);
};

const CHECK_INTERVAL_MS = parsePositiveInt(process.env.LOW_STOCK_CHECK_INTERVAL_MS, 60 * 1000);
const ALERT_COOLDOWN_MS = parsePositiveInt(process.env.LOW_STOCK_ALERT_COOLDOWN_MS, 60 * 60 * 1000);

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const getAlertRecipients = async () => {
    const recipients = new Set();

    const adminEmails = [
        ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []),
        ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",") : []),
    ];

    for (const email of adminEmails) {
        const normalized = normalizeEmail(email);
        if (normalized) {
            recipients.add(normalized);
        }
    }

    const adminUsers = await User.find({
        $or: [{ role: "admin" }, { isAdmin: true }],
    }).select("email");

    for (const user of adminUsers) {
        const normalized = normalizeEmail(user.email);
        if (normalized) {
            recipients.add(normalized);
        }
    }

    return Array.from(recipients);
};

const runLowStockCheck = async () => {
    const now = new Date();
    const items = await Inventory.find({});

    const lowStockItems = [];
    const recoveries = [];

    for (const item of items) {
        const stock = Number(item.stockQuantity);
        const threshold = Number(item.thresholdValue);

        if (stock <= threshold) {
            const lastAlertAt = item.lowStockAlertSentAt ? new Date(item.lowStockAlertSentAt).getTime() : null;
            const shouldAlert = !lastAlertAt || now.getTime() - lastAlertAt >= ALERT_COOLDOWN_MS;

            if (shouldAlert) {
                lowStockItems.push(item);
            }
        } else if (item.lowStockAlertSentAt) {
            recoveries.push(item._id);
        }
    }

    if (recoveries.length) {
        await Inventory.updateMany(
            { _id: { $in: recoveries } },
            { $set: { lowStockAlertSentAt: null } }
        );
    }

    if (!lowStockItems.length) {
        return { checked: items.length, alerted: 0 };
    }

    const recipients = await getAlertRecipients();

    if (!recipients.length) {
        console.log("Low stock detected, but no admin email recipients are configured.");
        return { checked: items.length, alerted: 0 };
    }

    await sendLowStockAlertEmail({
        recipients,
        items: lowStockItems,
        checkedAt: now,
    });

    await Inventory.updateMany(
        { _id: { $in: lowStockItems.map((item) => item._id) } },
        { $set: { lowStockAlertSentAt: now } }
    );

    return { checked: items.length, alerted: lowStockItems.length };
};

const startLowStockMonitor = () => {
    if (String(process.env.LOW_STOCK_ALERTS_ENABLED || "true").toLowerCase() === "false") {
        console.log("Low stock monitor disabled by LOW_STOCK_ALERTS_ENABLED=false");
        return null;
    }

    runLowStockCheck().catch((error) => {
        console.error(`Low stock check failed: ${error.message}`);
    });

    console.log(
        `Low stock monitor started. Interval=${CHECK_INTERVAL_MS}ms, cooldown=${ALERT_COOLDOWN_MS}ms`
    );

    return setInterval(() => {
        runLowStockCheck().catch((error) => {
            console.error(`Low stock check failed: ${error.message}`);
        });
    }, CHECK_INTERVAL_MS);
};

module.exports = {
    startLowStockMonitor,
    runLowStockCheck,
};
