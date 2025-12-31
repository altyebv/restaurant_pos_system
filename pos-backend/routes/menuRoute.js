const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/', menuController.getMenus);
router.post('/category', menuController.addCategory);
router.post('/item', menuController.addItem);
router.delete('/:id', menuController.deleteCategory);
router.delete('/:menuId/item/:itemId', menuController.deleteItem);

module.exports = router;
