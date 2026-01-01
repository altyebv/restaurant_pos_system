const { getDB } = require("../config/database");
const bcrypt = require("bcrypt");

class User {
    static async create(userData) {
        const db = getDB();

        // Validate email format
        if (!/\S+@\S+\.\S+/.test(userData.email)) {
            throw new Error("Email must be in valid format!");
        }

        // Validate phone format
        if (!/\d{10}/.test(userData.phone)) {
            throw new Error("Phone number must be a 10-digit number!");
        }

        // Validate cashier code format
        const cashierCode = userData.cashierCode.toUpperCase();
        if (!/^[A-Z]\d+$/.test(cashierCode)) {
            throw new Error(`${cashierCode} is not a valid cashier code! Use format: A1, B1, etc.`);
        }

        // Hash password
        const salt = await bcrypt.genSalt(4);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const stmt = db.prepare(`
            INSERT INTO users (
                name, email, phone, password, role, cashierCode, isActive
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            userData.name,
            userData.email,
            userData.phone,
            hashedPassword,
            userData.role,
            cashierCode,
            1
        );

        return this.findById(result.lastInsertRowid);
    }

    static findById(id) {
        const db = getDB();
        const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
        const user = stmt.get(id);
        return user ? this._parseUser(user) : null;
    }

    static findOne(filters = {}) {
        const db = getDB();
        let query = "SELECT * FROM users WHERE 1=1";
        const params = [];

        if (filters.email) {
            query += " AND email = ?";
            params.push(filters.email);
        }

        if (filters.cashierCode) {
            query += " AND cashierCode = ?";
            params.push(filters.cashierCode);
        }

        if (filters.username) {
            query += " AND username = ?";
            params.push(filters.username);
        }

        query += " LIMIT 1";

        const stmt = db.prepare(query);
        const user = stmt.get(...params);
        return user ? this._parseUser(user) : null;
    }

    static findAll(filters = {}) {
        const db = getDB();
        let query = "SELECT * FROM users WHERE 1=1";
        const params = [];

        if (filters.role) {
            query += " AND role = ?";
            params.push(filters.role);
        }

        if (filters.isActive !== undefined) {
            query += " AND isActive = ?";
            params.push(filters.isActive ? 1 : 0);
        }

        query += " ORDER BY createdAt DESC";

        const stmt = db.prepare(query);
        const users = stmt.all(...params);
        return users.map(user => this._parseUser(user));
    }

    static async update(id, updates) {
        const db = getDB();
        const fields = [];
        const values = [];

        // Hash password if being updated
        if (updates.password) {
            const salt = await bcrypt.genSalt(4);
            updates.password = await bcrypt.hash(updates.password, salt);
        }

        // Validate cashier code if being updated
        if (updates.cashierCode) {
            const cashierCode = updates.cashierCode.toUpperCase();
            if (!/^[A-Z]\d+$/.test(cashierCode)) {
                throw new Error(`${cashierCode} is not a valid cashier code! Use format: A1, B1, etc.`);
            }
            updates.cashierCode = cashierCode;
        }

        Object.keys(updates).forEach(key => {
            fields.push(`${key} = ?`);
            values.push(updates[key]);
        });

        fields.push("updatedAt = CURRENT_TIMESTAMP");
        values.push(id);

        const stmt = db.prepare(`
            UPDATE users 
            SET ${fields.join(", ")} 
            WHERE id = ?
        `);

        stmt.run(...values);
        return this.findById(id);
    }

    static delete(id) {
        const db = getDB();
        const stmt = db.prepare("DELETE FROM users WHERE id = ?");
        const result = stmt.run(id);
        return result.changes > 0;
    }

    // Select without password
    static findByIdSafe(id) {
        const user = this.findById(id);
        if (user) {
            delete user.password;
        }
        return user;
    }

    static findAllSafe(filters = {}) {
        const users = this.findAll(filters);
        return users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }

    static _parseUser(user) {
        if (!user) return null;

        return {
            id: user.id,
            _id: user.id, // For compatibility with existing code
            name: user.name,
            email: user.email,
            phone: user.phone,
            password: user.password,
            role: user.role,
            cashierCode: user.cashierCode,
            isActive: user.isActive === 1,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
}

module.exports = User;