// migrate-database.js
// Run this once to update your database schema
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = "./data/pos.db";

console.log("🔄 Starting database migration...");

// Backup existing database if it exists
if (fs.existsSync(dbPath)) {
    const backupPath = `./data/pos.db.backup.${Date.now()}`;
    fs.copyFileSync(dbPath, backupPath);
    console.log(`📦 Backup created: ${backupPath}`);
}

const db = new Database(dbPath);

try {
    // Drop all existing tables
    console.log("🗑️  Dropping old tables...");
    db.exec(`DROP TABLE IF EXISTS payments`);
    db.exec(`DROP TABLE IF EXISTS orders`);
    db.exec(`DROP TABLE IF EXISTS sessions`);
    db.exec(`DROP TABLE IF EXISTS menus`);
    db.exec(`DROP TABLE IF EXISTS users`);

    // Create tables with correct schema
    console.log("🏗️  Creating new tables...");
    
    // Users table
    db.exec(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'cashier', 'manager')),
            cashierCode TEXT UNIQUE NOT NULL,
            isActive INTEGER DEFAULT 1,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Sessions table
    db.exec(`
        CREATE TABLE sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cashier_id INTEGER NOT NULL,
            startedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            endedAt TEXT,
            startingBalance REAL DEFAULT 0,
            totalSales REAL DEFAULT 0,
            totalCashCollected REAL DEFAULT 0,
            totalExpenses REAL DEFAULT 0,
            totalOrders INTEGER DEFAULT 0,
            endBalance REAL DEFAULT 0,
            comment TEXT,
            status TEXT NOT NULL CHECK(status IN ('active', 'closed', 'reviewed')) DEFAULT 'active',
            expenses TEXT DEFAULT '[]',
            operations TEXT DEFAULT '[]',
            orderCounter INTEGER DEFAULT 0,
            lastOrderDate TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cashier_id) REFERENCES users(id)
        )
    `);

    // Menus table
    db.exec(`
        CREATE TABLE menus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            isAvailable INTEGER DEFAULT 1,
            imageUrl TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Orders table
    db.exec(`
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            orderNumber TEXT UNIQUE NOT NULL,
            items TEXT NOT NULL,
            bills TEXT NOT NULL,
            paymentMethod TEXT NOT NULL,
            cashier_id INTEGER NOT NULL,
            session_id INTEGER,
            status TEXT NOT NULL CHECK(status IN ('completed', 'refunded', 'voided')) DEFAULT 'completed',
            refundedAt TEXT,
            refundReason TEXT,
            refundedBy_id INTEGER,
            replacedBy_id INTEGER,
            replacedOrder_id INTEGER,
            editHistory TEXT,
            receipt TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cashier_id) REFERENCES users(id),
            FOREIGN KEY (session_id) REFERENCES sessions(id),
            FOREIGN KEY (refundedBy_id) REFERENCES users(id),
            FOREIGN KEY (replacedBy_id) REFERENCES orders(id),
            FOREIGN KEY (replacedOrder_id) REFERENCES orders(id)
        )
    `);

    // Payments table
    db.exec(`
        CREATE TABLE payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            session_id INTEGER,
            amount REAL NOT NULL,
            method TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('completed', 'refunded')) DEFAULT 'completed',
            refundedAt TEXT,
            metadata TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    `);

    // Create indexes
    console.log("📊 Creating indexes...");
    db.exec(`
        CREATE INDEX idx_orders_orderNumber ON orders(orderNumber);
        CREATE INDEX idx_orders_session ON orders(session_id);
        CREATE INDEX idx_orders_cashier ON orders(cashier_id);
        CREATE