const Menu = require('../models/menuModel');

exports.getMenus = async (req, res, next) => {
  try {
    const menus = Menu.findAll({});
    res.status(200).json({ success: true, data: menus });
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { menuId, itemId } = req.params;
    const { name, price, image } = req.body;
    
    const menu = Menu.findById(Number(menuId));
    if (!menu) return res.status(404).json({ success: false, message: 'Category not found' });
    
    const items = menu.items || [];
    const itemIndex = items.findIndex(it => String(it.id) === String(itemId));
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Item not found' });
    
    items[itemIndex] = { ...items[itemIndex], name, price, image };
    Menu.update(Number(menuId), { items });
    
    res.status(200).json({ success: true, data: items[itemIndex] });
  } catch (err) {
    next(err);
  }
};

exports.addCategory = async (req, res, next) => {
  try {
    const { name, bgColor, icon, imageUrl } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    // Create a menu group for this category
    const id = Date.now();
    const menu = Menu.create({ 
      id, 
      name, 
      items: [],
      category: 'category',
      price: 0,
      bgColor,
      icon,
      imageUrl
    });
    
    res.status(201).json({ success: true, data: menu });
  } catch (err) {
    next(err);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const { name, price, category, image, imageUrl } = req.body;
    if (!name || price == null) return res.status(400).json({ success: false, message: 'Name and price are required' });

    let menu = Menu.findOne({ name: category });
    
    if (!menu) {
      // Create category/menu if not found
      menu = Menu.create({ 
        id: Date.now(), 
        name: category || 'Uncategorized', 
        items: [],
        category: 'category',
        price: 0
      });
    }

    // Create an item id (ensure uniqueness inside menu)
    const itemId = Date.now() % 1000000;
    const newItem = { 
      id: itemId, 
      name, 
      price, 
      category,
      image: image || imageUrl || null,
      imageUrl: image || imageUrl || null
    };
    
    const items = menu.items || [];
    items.push(newItem);
    
    Menu.update(menu.id, { items });
    
    res.status(201).json({ success: true, data: newItem });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = Menu.delete(Number(id));
    
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found' });
    
    res.status(200).json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const { menuId, itemId } = req.params;
    const menu = Menu.findById(Number(menuId));
    
    if (!menu) return res.status(404).json({ success: false, message: 'Category not found' });

    const items = menu.items || [];
    const beforeCount = items.length;
    const filteredItems = items.filter((it) => String(it.id) !== String(itemId));
    
    if (filteredItems.length === beforeCount) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    const updated = Menu.update(Number(menuId), { items: filteredItems });
    
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};