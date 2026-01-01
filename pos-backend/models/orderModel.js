const { getDB } = require("../config/database");

class Order {
    static create(orderData) {
        const db = getDB();
        const stmt = db.prepare(`
            INSERT INTO orders (
                orderNumber, items, bills, paymentMethod, 
                cashier_id, session_id, status, receipt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            orderData.orderNumber,
            JSON.stringify(orderData.items),
            JSON.stringify(orderData.bills),
            orderData.paymentMethod,
            orderData.cashier,
            orderData.session,
            orderData.status || "completed",
            orderData.receipt ? JSON.stringify(orderData.receipt) : null
        );

        return this.findById(result.lastInsertRowid);
    }

    static findById(id) {
        const db = getDB();
        const stmt = db.prepare("SELECT * FROM orders WHERE id = ?");
        const order = stmt.get(id);
        return order ? this._parseOrder(order) : null;
    }

    static findByOrderNumber(orderNumber) {
        const db = getDB();
        const stmt = db.prepare("SELECT * FROM orders WHERE orderNumber = ?");
        const order = stmt.get(orderNumber);
        return order ? this._parseOrder(order) : null;
    }

    static findAll(filters = {}) {
        const db = getDB();
        let query = "SELECT * FROM orders WHERE 1=1";
        const params = [];

        if (filters.session_id) {
            query += " AND session_id = ?";
            params.push(filters.session_id);
        }

        if (filters.cashier_id) {
            query += " AND cashier_id = ?";
            params.push(filters.cashier_id);
        }

        if (filters.status) {
            query += " AND status = ?";
            params.push(filters.status);
        }

        if (filters.startDate) {
            query += " AND createdAt >= ?";
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += " AND createdAt <= ?";
            params.push(filters.endDate);
        }

        query += " ORDER BY createdAt DESC";

        if (filters.limit) {
            query += " LIMIT ?";
            params.push(filters.limit);
        }

        const stmt = db.prepare(query);
        const orders = stmt.all(...params);
        return orders.map(order => this._parseOrder(order));
    }

    static update(id, updates) {
        const db = getDB();
        const fields = [];
        const values = [];

        // Build dynamic update query
        Object.keys(updates).forEach(key => {
            if (key === "items" || key === "bills" || key === "editHistory" || key === "receipt") {
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
            UPDATE orders 
            SET ${fields.join(", ")} 
            WHERE id = ?
        `);

        stmt.run(...values);
        return this.findById(id);
    }

    static delete(id) {
        const db = getDB();
        const stmt = db.prepare("DELETE FROM orders WHERE id = ?");
        const result = stmt.run(id);
        return result.changes > 0;
    }

    static addEditHistory(orderId, editData) {
        const order = this.findById(orderId);
        if (!order) return null;

        const editHistory = order.editHistory || [];
        editHistory.push({
            editedAt: new Date().toISOString(),
            editedBy: editData.editedBy,
            previousItems: editData.previousItems,
            previousBills: editData.previousBills,
            reason: editData.reason
        });

        return this.update(orderId, { editHistory });
    }

    static refund(orderId, refundData) {
        return this.update(orderId, {
            status: "refunded",
            refundedAt: new Date().toISOString(),
            refundReason: refundData.reason,
            refundedBy_id: refundData.refundedBy
        });
    }

    // Helper to parse JSON fields
    static _parseOrder(order) {
        if (!order) return null;

        return {
            id: order.id,
            orderNumber: order.orderNumber,
            items: JSON.parse(order.items),
            bills: JSON.parse(order.bills),
            paymentMethod: order.paymentMethod,
            cashier: order.cashier_id,
            session: order.session_id,
            status: order.status,
            refundedAt: order.refundedAt,
            refundReason: order.refundReason,
            refundedBy: order.refundedBy_id,
            replacedBy: order.replacedBy_id,
            replacedOrder: order.replacedOrder_id,
            editHistory: order.editHistory ? JSON.parse(order.editHistory) : [],
            receipt: order.receipt ? JSON.parse(order.receipt) : null,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };
    }

    // Populate related data (like Mongoose populate)
    static populate(order, fields = []) {
        if (!order) return null;

        const db = getDB();
        const populated = { ...order };

        if (fields.includes("cashier") && order.cashier) {
            const stmt = db.prepare("SELECT id, name, email, role, cashierCode FROM users WHERE id = ?");
            populated.cashier = stmt.get(order.cashier);
        }

        if (fields.includes("session") && order.session) {
            const stmt = db.prepare("SELECT * FROM sessions WHERE id = ?");
            populated.session = stmt.get(order.session);
        }

        if (fields.includes("refundedBy") && order.refundedBy) {
            const stmt = db.prepare("SELECT id, name, email, role, cashierCode FROM users WHERE id = ?");
            populated.refundedBy = stmt.get(order.refundedBy);
        }

        return populated;
    }
}

module.exports = Order;