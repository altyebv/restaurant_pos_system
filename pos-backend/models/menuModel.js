const { getDB } = require("../config/database");

class Menu {
    static create(menuData) {
        const db = getDB();

        // If creating a category (no price), use category structure
        if (!menuData.price && menuData.items !== undefined) {
            // This is a category with items - store items and metadata as JSON
            const metadata = {
                bgColor: menuData.bgColor || null,
                icon: menuData.icon || null
            };
            
            const descriptionData = {
                items: menuData.items || [],
                metadata
            };

            const categoryStmt = db.prepare(`
                INSERT INTO menus (
                    name, category, price, description, isAvailable, imageUrl
                ) VALUES (?, ?, ?, ?, ?, ?)
            `);

            const result = categoryStmt.run(
                menuData.name,
                'category', // Mark as category
                0, // No price for categories
                JSON.stringify(descriptionData),
                1,
                menuData.imageUrl || null
            );

            return this.findById(result.lastInsertRowid);
        }

        // Regular menu item
        const stmt = db.prepare(`
            INSERT INTO menus (
                name, category, price, description, isAvailable, imageUrl
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            menuData.name,
            menuData.category || 'Uncategorized',
            menuData.price || 0,
            menuData.description || null,
            menuData.isAvailable !== undefined ? (menuData.isAvailable ? 1 : 0) : 1,
            menuData.imageUrl || menuData.image || null
        );

        return this.findById(result.lastInsertRowid);
    }

    static findById(id) {
        const db = getDB();
        const stmt = db.prepare("SELECT * FROM menus WHERE id = ?");
        const menu = stmt.get(id);
        return menu ? this._parseMenu(menu) : null;
    }

    static findAll(filters = {}) {
        const db = getDB();
        let query = "SELECT * FROM menus WHERE category = 'category'"; // Only get categories
        const params = [];

        if (filters.isAvailable !== undefined) {
            query += " AND isAvailable = ?";
            params.push(filters.isAvailable ? 1 : 0);
        }

        query += " ORDER BY id";

        const stmt = db.prepare(query);
        const menus = stmt.all(...params);
        return menus.map(menu => this._parseMenu(menu));
    }

    static findOne(filters = {}) {
        const db = getDB();
        let query = "SELECT * FROM menus WHERE 1=1";
        const params = [];

        if (filters.name) {
            query += " AND name = ?";
            params.push(filters.name);
        }

        if (filters.category) {
            query += " AND category = ?";
            params.push(filters.category);
        }

        query += " LIMIT 1";

        const stmt = db.prepare(query);
        const menu = stmt.get(...params);
        return menu ? this._parseMenu(menu) : null;
    }

    static update(id, updates) {
        const db = getDB();
        const fields = [];
        const values = [];

        // Get current menu to preserve metadata when updating items
        const currentMenu = this.findById(id);

        Object.keys(updates).forEach(key => {
            if (key === 'isAvailable') {
                fields.push(`${key} = ?`);
                values.push(updates[key] ? 1 : 0);
            } else if (key === 'items' && currentMenu && currentMenu.category === 'category') {
                // Store items array with metadata as JSON in description field
                const descriptionData = {
                    items: updates[key],
                    metadata: {
                        bgColor: updates.bgColor || currentMenu.bgColor || null,
                        icon: updates.icon || currentMenu.icon || null
                    }
                };
                fields.push(`description = ?`);
                values.push(JSON.stringify(descriptionData));
            } else if (key === 'bgColor' || key === 'icon') {
                // Handle metadata updates for categories
                if (currentMenu && currentMenu.category === 'category') {
                    const descriptionData = {
                        items: updates.items || currentMenu.items || [],
                        metadata: {
                            bgColor: updates.bgColor || currentMenu.bgColor || null,
                            icon: updates.icon || currentMenu.icon || null
                        }
                    };
                    fields.push(`description = ?`);
                    values.push(JSON.stringify(descriptionData));
                }
            } else if (key === 'image' || key === 'imageUrl') {
                fields.push(`imageUrl = ?`);
                values.push(updates[key]);
            } else {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        fields.push("updatedAt = CURRENT_TIMESTAMP");
        values.push(id);

        const stmt = db.prepare(`
            UPDATE menus 
            SET ${fields.join(", ")} 
            WHERE id = ?
        `);

        stmt.run(...values);
        return this.findById(id);
    }

    static delete(id) {
        const db = getDB();
        const stmt = db.prepare("DELETE FROM menus WHERE id = ?");
        const result = stmt.run(id);
        return result.changes > 0;
    }

    static _parseMenu(menu) {
        if (!menu) return null;

        // Try to parse items from description if it's a category
        let items = [];
        let metadata = {};
        
        if (menu.category === 'category' && menu.description) {
            try {
                const parsed = JSON.parse(menu.description);
                // Description can contain items array and metadata (bgColor, icon)
                if (Array.isArray(parsed)) {
                    items = parsed;
                } else if (parsed.items) {
                    items = parsed.items;
                    metadata = parsed.metadata || {};
                }
            } catch (e) {
                items = [];
            }
        }

        return {
            id: menu.id,
            _id: menu.id, // For compatibility
            name: menu.name,
            category: menu.category,
            price: menu.price,
            description: menu.category === 'category' ? null : menu.description,
            items: items, // Include items array for categories
            bgColor: metadata.bgColor || menu.imageUrl,
            icon: metadata.icon || null,
            isAvailable: menu.isAvailable === 1,
            imageUrl: menu.imageUrl,
            image: menu.imageUrl, // Alias for compatibility
            createdAt: menu.createdAt,
            updatedAt: menu.updatedAt
        };
    }
}

module.exports = Menu;