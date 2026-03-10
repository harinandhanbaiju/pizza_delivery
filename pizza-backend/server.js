const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const User = require("./models/User");

dotenv.config({ path: path.join(__dirname, ".env") });

const seedDummyAccounts = async () => {
    if (String(process.env.NODE_ENV || "development").toLowerCase() === "production") {
        return;
    }

    const dummyAccounts = [
        {
            name: "Demo User",
            email: process.env.DUMMY_USER_EMAIL || "dummy.user@pizza.test",
            password: process.env.DUMMY_USER_PASSWORD || "User@12345",
            role: "user",
            isAdmin: false,
        },
        {
            name: "Demo Admin",
            email: process.env.DUMMY_ADMIN_EMAIL || "dummy.admin@pizza.test",
            password: process.env.DUMMY_ADMIN_PASSWORD || "Admin@12345",
            role: "admin",
            isAdmin: true,
        },
    ];

    for (const account of dummyAccounts) {
        const existingUser = await User.findOne({ email: account.email });

        if (!existingUser) {
            await User.create({
                ...account,
                isVerified: true,
            });
            console.log(`Created dummy ${account.role} account: ${account.email}`);
        }
    }
};

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));

app.get("/", (req, res) => {
    res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await seedDummyAccounts();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();