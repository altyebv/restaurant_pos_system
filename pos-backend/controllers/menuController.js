// menuController.js
const Menu = require('../models/menuModel');

exports.getMenus = async (req, res, next) => {
  try {
    const menus = await Menu.find({});
    res.status(200).json({ success: true, data: menus });
  } catch (err) {
    next(err);
  }
};
// menuController.js
exports.updateItem = async (req, res, next) => {
  try {
    const { menuId, itemId } = req.params;
    const { name, price, image } = req.body;
    
    const menu = await Menu.findById(menuId);
    if (!menu) return res.status(404).json({ success: false, message: 'Category not found' });
    
    const itemIndex = menu.items.findIndex(it => String(it.id) === String(itemId));
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Item not found' });
    
    menu.items[itemIndex] = { ...menu.items[itemIndex], name, price, image };
    await menu.save();
    
    res.status(200).json({ success: true, data: menu.items[itemIndex] });
  } catch (err) {
    next(err);
  }
};
exports.addCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    // create a menu group for this category
    const id = Date.now();
    const menu = new Menu({ id, name, items: [] });
    await menu.save();
    res.status(201).json({ success: true, data: menu });
  } catch (err) {
    next(err);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const { name, price, category } = req.body;
    if (!name || price == null) return res.status(400).json({ success: false, message: 'Name and price are required' });

    let menu = await Menu.findOne({ name: category });
    if (!menu) {
      // create category/menu if not found
      menu = new Menu({ id: Date.now(), name: category || 'Uncategorized', items: [] });
    }

    // create an item id (ensure uniqueness inside menu)
    const itemId = Date.now() % 1000000;
    const newItem = { id: itemId, name, price, category };
    menu.items.push(newItem);
    await menu.save();

    res.status(201).json({ success: true, data: newItem });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Menu.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data: deleted });
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const { menuId, itemId } = req.params;
    const menu = await Menu.findById(menuId);
    if (!menu) return res.status(404).json({ success: false, message: 'Category not found' });

    const beforeCount = menu.items.length;
    menu.items = menu.items.filter((it) => String(it.id) !== String(itemId));
    if (menu.items.length === beforeCount) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    await menu.save();
    res.status(200).json({ success: true, data: menu });
  } catch (err) {
    next(err);
  }
};
