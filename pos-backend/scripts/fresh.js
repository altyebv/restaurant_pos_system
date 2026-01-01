// force-fresh-db.js - Forces a completely fresh database
const fs = require("fs");
const path = require("path");

console.log("🔥 Force deleting all database files...");

const dbFiles = [
    "../data/pos.db",
    "../data/pos.db-wal",
    "../data/pos.db-shm"
];

dbFiles.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            fs.unlinkSync(file);
            console.log(`✅ Deleted: ${file}`);
        } catch (err) {
            console.error(`❌ Failed to delete ${file}:`, err.message);
        }
    } else {
        console.log(`⏭️  Not found: ${file}`);
    }
});

console.log("\n✨ Database files cleared!");
console.log("Now run: node seed-test-user.js");