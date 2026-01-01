const { getDB } = require("../config/database");

class Session {
    static create(sessionData) {
        const db = getDB();
        const stmt = db.prepare(`
            INSERT INTO sessions (
                cashier_id, startingBalance, status, 
                expenses, operations, orderCounter, lastOrderDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            sessionData.cashier,
            sessionData.startingBalance || 0,
            sessionData.status || "active",
            JSON.stringify(sessionData.expenses || []),
            JSON.stringify(sessionData.operations || []),
            sessionData.orderCounter || 0,
            sessionData.lastOrderDate || null
        );

        return this.findById(result.lastInsertRowid);
    }

    static findById(id) {
        const db = getDB();
        const stmt = db.prepare("SELECT * FROM sessions WHERE id = ?");
        const session = stmt.get(id);
        return session ? this._parseSession(session) : null;
    }

    static findOne(filters = {}) {
        const db = getDB();
        let query = "SELECT * FROM sessions WHERE 1=1";
        const params = [];

        if (filters.cashier_id) {
            query += " AND cashier_id = ?";
            params.push(filters.cashier_id);
        }

        if (filters.status) {
            query += " AND status = ?";
            params.push(filters.status);
        }

        query += " ORDER BY startedAt DESC LIMIT 1";

        const stmt = db.prepare(query);
        const session = stmt.get(...params);
        return session ? this._parseSession(session) : null;
    }

    static findAll(filters = {}) {
        const db = getDB();
        let query = "SELECT * FROM sessions WHERE 1=1";
        const params = [];

        if (filters.cashier_id) {
            query += " AND cashier_id = ?";
            params.push(filters.cashier_id);
        }

        if (filters.status) {
            query += " AND status = ?";
            params.push(filters.status);
        }

        query += " ORDER BY startedAt DESC";

        const stmt = db.prepare(query);
        const sessions = stmt.all(...params);
        return sessions.map(session => this._parseSession(session));
    }

    static update(id, updates) {
        const db = getDB();
        const fields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (key === "expenses" || key === "operations") {
                fields.push(`${key} = ?`);
                values.push(JSON.stringify(updates[key]));
            } else {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        fields.push("updatedAt = CURRENT_TIMESTAMP");
        values.push(id);

        const stmt = db.prepare(`
            UPDATE sessions 
            SET ${fields.join(", ")} 
            WHERE id = ?
        `);

        stmt.run(...values);
        return this.findById(id);
    }

    static delete(id) {
        const db = getDB();
        const stmt = db.prepare("DELETE FROM sessions WHERE id = ?");
        const result = stmt.run(id);
        return result.changes > 0;
    }

    static _parseSession(session) {
        if (!session) return null;

        return {
            id: session.id,
            cashier: session.cashier_id,
            cashier_id: session.cashier_id,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            startingBalance: session.startingBalance,
            totalSales: session.totalSales || 0,
            totalCashCollected: session.totalCashCollected || 0,
            totalExpenses: session.totalExpenses || 0,
            totalOrders: session.totalOrders || 0,
            endBalance: session.endBalance || 0,
            comment: session.comment,
            status: session.status,
            expenses: session.expenses ? JSON.parse(session.expenses) : [],
            operations: session.operations ? JSON.parse(session.operations) : [],
            orderCounter: session.orderCounter || 0,
            lastOrderDate: session.lastOrderDate,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        };
    }

    static populate(session, fields = []) {
        if (!session) return null;

        const db = getDB();
        const populated = { ...session };

        if (fields.includes("cashier")) {
            const stmt = db.prepare("SELECT id, username, role, cashierCode FROM users WHERE id = ?");
            populated.cashier = stmt.get(session.cashier_id);
        }

        return populated;
    }
}

module.exports = Session;