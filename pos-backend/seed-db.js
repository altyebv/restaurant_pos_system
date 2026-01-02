// seed-menu-data.js - Seeds the database with demo menu data
const { initDB, getDB } = require("./config/database");

console.log("🍽️  Seeding menu data...");

// Initialize database
initDB();

// Menu data
const menuData = [
  {
    name: "سندوتشات",
    bgColor: "#b73e3e",
    icon: "🍲",
    items: [
      { id: 1, name: "بيرقر", price: 5000, category: "Vegetarian" },
      { id: 2, name: "شاورما دجاج", price: 4500, category: "Non-Vegetarian" },
      { id: 3, name: "أقاشي", price: 4000, category: "Non-Vegetarian" },
      { id: 4, name: "طعمية", price: 1000, category: "Vegetarian" },
      { id: 5, name: "بوفتيك", price: 3000, category: "Vegetarian" },
      { id: 6, name: "كفتة", price: 3500, category: "Vegetarian" }
    ]
  },
  {
    name: "طلبات",
    bgColor: "#5b45b0",
    icon: "🍛",
    items: [
      { id: 7, name: "فرخة مشوية", price: 20000, category: "Non-Vegetarian" },
      { id: 8, name: "طلب أقاشي", price: 10000, category: "Vegetarian" },
      { id: 9, name: "مندي لحم", price: 25000, category: "Non-Vegetarian" },
      { id: 10, name: "مندي دجاج", price: 27000, category: "Vegetarian" },
      { id: 11, name: "طلب شاورما", price: 8000, category: "Vegetarian" },
      { id: 12, name: "طلب كبسة", price: 5000, category: "Non-Vegetarian" }
    ]
  },
  {
    name: "مشروبات",
    bgColor: "#7f167f",
    icon: "🍹",
    items: [
      { id: 13, name: "فراولة بالحليب", price: 4000, category: "Hot" },
      { id: 14, name: "مشكل", price: 3000, category: "Cold" },
      { id: 15, name: "برتقال", price: 2000, category: "Cold" },
      { id: 16, name: "مياه", price: 1500, category: "Cold" },
      { id: 17, name: "مشروب غازي", price: 2500, category: "Cold" },
      { id: 18, name: "ليمون بالنعناع", price: 1000, category: "Cold" }
    ]
  },
  {
    name: "حلويات",
    bgColor: "#1d2569",
    icon: "🍰",
    items: [
      { id: 19, name: "كيلو باسطة", price: 9000, category: "Vegetarian" },
      { id: 20, name: "كنافة", price: 8000, category: "Vegetarian" },
      { id: 21, name: "بسبوسة", price: 7800, category: "Vegetarian" },
      { id: 22, name: "بلح شام", price: 6500, category: "Vegetarian" }
    ]
  },
  {
    name: "بيتزا",
    bgColor: "#285430",
    icon: "🍕",
    items: [
      { id: 23, name: "بيتزا دجاج", price: 12000, category: "Vegetarian" },
      { id: 24, name: "بيتزا خضروات", price: 11000, category: "Vegetarian" },
      { id: 25, name: "فطيرة هوت دوق", price: 450, category: "Non-Vegetarian" }
    ]
  }
];

function seedMenus() {
  const db = getDB();
  
  try {
    // Clear existing menu data
    console.log("🗑️  Clearing existing menu data...");
    db.prepare("DELETE FROM menus").run();
    
    console.log("📝 Inserting menu categories and items...");
    
    menuData.forEach((menu, index) => {
      // Prepare the description data (contains items and metadata)
      const descriptionData = {
        items: menu.items,
        metadata: {
          bgColor: menu.bgColor,
          icon: menu.icon
        }
      };
      
      // Insert menu category with a unique ID based on timestamp
      const menuId = Date.now() + index;
      
      const stmt = db.prepare(`
        INSERT INTO menus (
          id, name, category, price, description, isAvailable, imageUrl
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        menuId,
        menu.name,
        'category', // Mark as category
        0, // No price for categories
        JSON.stringify(descriptionData),
        1, // Available
        null // No image URL for now
      );
      
      console.log(`  ✅ ${menu.name} (ID: ${menuId}) - ${menu.items.length} items`);
    });
    
    // Verify the data was inserted
    const allMenus = db.prepare("SELECT * FROM menus WHERE category = 'category'").all();
    console.log("\n🔍 Verification:");
    console.log(`  Found ${allMenus.length} categories in database`);
    
    const totalItems = menuData.reduce((sum, menu) => sum + menu.items.length, 0);
    
    console.log("\n🎉 Menu seeding completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Summary:`);
    console.log(`  - Categories: ${allMenus.length}`);
    console.log(`  - Total Items: ${totalItems}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✨ You can now use the menu in your POS app!");
    
  } catch (error) {
    console.error("❌ Error seeding menus:", error.message);
    console.error(error);
    process.exit(1);
  }
}

seedMenus();