const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String }
}, { _id: false });

const menuSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  bgColor: { type: String },
  icon: { type: String },
  items: { type: [itemSchema], default: [] }
});

const Menu = mongoose.model("Menu", menuSchema);
module.exports = Menu;
