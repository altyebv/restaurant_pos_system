// seed-test-user.js - Creates test users for development
const { initDB } = require("./config/database");
const User = require("./models/userModel");

console.log("🌱 Seeding test users...");

// Initialize database
initDB();

// At the top of seed-test-user.js, after initDB()
const { getDB } = require("./config/database");
const db = getDB();

console.log("\n🔍 Checking users table schema:");
const tableInfo = db.prepare("PRAGMA table_info(users)").all();
console.log("Columns:", tableInfo.map(col => col.name).join(", "));

if (!tableInfo.find(col => col.name === 'email')) {
    console.log("❌ ERROR: 'email' column is missing!");
    console.log("💡 Solution: Delete data/pos.db and run this script again");
    process.exit(1);
}

async function seedUsers() {
    try {
        // Check if users already exist
        const existingUser = User.findOne({ email: "admin@test.com" });
        if (existingUser) {
            console.log("⚠️  Test users already exist!");
            console.log("\n👤 Existing users:");
            const allUsers = User.findAll();
            allUsers.forEach(user => {
                console.log(`  - ${user.email} (${user.role}) - Code: ${user.cashierCode}`);
            });
            return;
        }

        // Create admin user
        console.log("Creating admin user...");
        const admin = await User.create({
            name: "Admin User",
            email: "admin@test.com",
            phone: "1234567890",
            password: "admin123",
            role: "admin",
            cashierCode: "A0"
        });
        console.log("✅ Admin created:", admin.email);

        // Create cashier user
        console.log("Creating cashier user...");
        const cashier = await User.create({
            name: "Test Cashier",
            email: "cash@test.com",
            phone: "1234567891",
            password: "asd",
            role: "cashier",
            cashierCode: "A1"
        });
        console.log("✅ Cashier created:", cashier.email);

        // Create manager user
        console.log("Creating manager user...");
        const manager = await User.create({
            name: "Test Manager",
            email: "z@test.com",
            phone: "1234567892",
            password: "asd",
            role: "admin",
            cashierCode: "M1"
        });
        console.log("✅ Manager created:", manager.email);

        console.log("\n🎉 Test users created successfully!");
        console.log("\n📝 Login credentials:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Admin:");
        console.log("  Email: admin@test.com");
        console.log("  Password: admin123");
        console.log("  Cashier Code: A0");
        console.log("");
        console.log("Cashier:");
        console.log("  Email: cashier@test.com");
        console.log("  Password: cashier123");
        console.log("  Cashier Code: A1");
        console.log("");
        console.log("Manager:");
        console.log("  Email: manager@test.com");
        console.log("  Password: manager123");
        console.log("  Cashier Code: M1");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    } catch (error) {
        console.error("❌ Error seeding users:", error.message);
        process.exit(1);
    }
}

seedUsers();