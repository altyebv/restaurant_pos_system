const connectDB = require("../config/database");
const Menu = require("../models/menuModel");
require("../config/config");

const menus = [
  { id: 1, name: "سندوتشات", bgColor: "#b73e3e", icon: "🍲", items: [
      { id: 1, name: "بيرقر", price: 5000, category: "Vegetarian" },
      { id: 2, name: "شاورما دجاج", price: 4500, category: "Non-Vegetarian" },
      { id: 3, name: "أقاشي", price: 4000, category: "Non-Vegetarian" },
      { id: 4, name: "طعمية", price: 1000, category: "Vegetarian" },
      { id: 5, name: "بوفتيك", price: 3000, category: "Vegetarian" },
      { id: 6, name: "كفتة", price: 3500, category: "Vegetarian" }
    ] },
  { id: 2, name: "طلبات", bgColor: "#5b45b0", icon: "🍛", items: [
      { id: 1, name: "فرخة مشوية", price: 20000, category: "Non-Vegetarian" },
      { id: 2, name: "طلب أقاشي", price: 10000, category: "Vegetarian" },
      { id: 3, name: "مندي لحم", price: 25000, category: "Non-Vegetarian" },
      { id: 4, name: "مندي دجاج", price: 27000, category: "Vegetarian" },
      { id: 5, name: "طلب شاورما", price: 8000, category: "Vegetarian" },
      { id: 6, name: "طلب كبسة", price: 5000, category: "Non-Vegetarian" }
    ] },
  { id: 3, name: "مشروبات", bgColor: "#7f167f", icon: "🍹", items: [
      { id: 1, name: "فراولة بالحليب", price: 4000, category: "Hot" },
      { id: 2, name: "مشكل", price: 3000, category: "Cold" },
      { id: 3, name: "برتقال", price: 2000, category: "Cold" },
      { id: 4, name: "مياه", price: 1500, category: "Cold" },
      { id: 5, name: "مشروب غازي", price: 2500, category: "Cold" },
      { id: 6, name: "ليمون بالنعناع", price: 1000, category: "Cold" }
    ] },
  { id: 4, name: "حلويات", bgColor: "#1d2569", icon: "🍰", items: [
      { id: 1, name: "كيلو باسطة", price: 9000, category: "Vegetarian" },
      { id: 2, name: "كنافة", price: 8000, category: "Vegetarian" },
      { id: 3, name: "بسبوسة", price: 7800, category: "Vegetarian" },
      { id: 4, name: "بلح شام", price: 6500, category: "Vegetarian" }
    ] },
  { id: 6, name: "بيتزا", bgColor: "#285430", icon: "🍕", items: [
      { id: 1, name: "بيتزا دجاج", price: 12000, category: "Vegetarian" },
      { id: 2, name: "بيتزا خضروات", price: 11000, category: "Vegetarian" },
      { id: 3, name: "فطيرة هوت دوق", price: 450, category: "Non-Vegetarian" }
    ] }
];

const seed = async () => {
  try {
    await connectDB();
    console.log("Connected to DB — seeding menus...");

    // Clear existing menus
    await Menu.deleteMany({});

    // Insert menus (ensure item ids are numeric and consistent)
    await Menu.insertMany(menus);
    console.log("Menu seeding completed.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seed();
