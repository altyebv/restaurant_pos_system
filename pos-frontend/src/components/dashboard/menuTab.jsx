import React, { useState, useEffect } from "react";
import {
    MdAdd,
    MdEdit,
    MdDelete,
    MdClose,
    MdSave,
    MdImage,
    MdRestaurantMenu
} from "react-icons/md";
import { getMenus, addCategory, addMenuItem, deleteCategory, deleteMenuItem } from "../../https/index";

// ============= SHARED UI COMPONENTS =============

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
    if (!isOpen) return null;
    const sizes = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className={`bg-[#1a1a1a] rounded-xl ${sizes[size]} w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp`}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-[#1a1a1a] z-10">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
                    >
                        <MdClose size={24} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const Button = ({ onClick, children, variant = "primary", icon, className = "", disabled = false, type = "button" }) => {
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
        success: "bg-green-600 hover:bg-green-700 active:bg-green-800",
        danger: "bg-red-600 hover:bg-red-700 active:bg-red-800",
        ghost: "bg-transparent hover:bg-gray-800 border border-gray-700"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        >
            {icon}
            {children}
        </button>
    );
};

const Input = ({ label, error, icon, ...props }) => (
    <div className="space-y-2">
        {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
        <div className="relative">
            {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</div>}
            <input
                {...props}
                className={`w-full px-3 py-2.5 ${icon ? 'pl-10' : ''} bg-[#0f0f0f] border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${error ? "border-red-500" : "border-gray-700"
                    }`}
            />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
);

const Card = ({ title, children, actions, className = "" }) => (
    <div className={`bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors ${className}`}>
        {title && (
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MdRestaurantMenu className="text-blue-400" />
                    {title}
                </h3>
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>
        )}
        {children}
    </div>
);

// ============= MENU ITEM CARD =============

const MenuItemCard = ({ item, onEdit, onDelete }) => {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="bg-[#0f0f0f] rounded-lg border border-gray-700 hover:border-gray-600 transition-all hover:shadow-lg group">
            {/* Image */}
            <div className="relative h-40 bg-gray-900 rounded-t-lg overflow-hidden">
                {item.image && !imageError ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        onError={() => setImageError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <MdImage size={48} className="text-gray-700" />
                    </div>
                )}

                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(item)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-colors"
                    >
                        <MdEdit size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(item)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg shadow-lg transition-colors"
                    >
                        <MdDelete size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h4 className="font-medium text-white text-lg mb-1 truncate">{item.name}</h4>
                <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-400">${item.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">ID: {item.id}</span>
                </div>
            </div>
        </div>
    );
};

// ============= ADD/EDIT CATEGORY MODAL =============

const CategoryModal = ({ isOpen, onClose, onSubmit, editingCategory }) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingCategory) {
            setName(editingCategory.name);
        } else {
            setName("");
        }
    }, [editingCategory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await onSubmit({ name: name.trim() });
            setName("");
            onClose();
        } catch (error) {
            console.error("Failed to save category:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingCategory ? "Edit Category" : "Add Category"} size="sm">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="إسم الفئة"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مشويات . شرقي , بلدي"
                    required
                    autoFocus
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        إلغاء
                    </Button>
                    <Button variant="success" type="submit" icon={<MdSave />} disabled={loading}>
                        {loading ? "Saving..." : editingCategory ? "تحديث" : "إضافة الفئة"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

// ============= ADD/EDIT ITEM MODAL =============

const ItemModal = ({ isOpen, onClose, onSubmit, categories, editingItem }) => {
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "",
        image: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingItem) {
            setFormData({
                name: editingItem.name,
                price: editingItem.price,
                category: editingItem.category,
                image: editingItem.image || ""
            });
        } else {
            setFormData({
                name: "",
                price: "",
                category: categories[0]?.name || "",
                image: ""
            });
        }
    }, [editingItem, categories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const price = parseFloat(formData.price);
        if (!formData.name.trim() || isNaN(price) || price <= 0) return;

        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                price,
                id: editingItem?.id
            });
            setFormData({ name: "", price: "", category: "", image: "" });
            onClose();
        } catch (error) {
            console.error("Failed to save item:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingItem ? "Edit Item" : "Add New Item"} size="md">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="إسم العنصر"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="بيرقر دجاج , سلطة سيزر"
                        required
                        autoFocus
                    />

                    <Input
                        label="السعر"
                        type="number"
                        step="100"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">الفئة</label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        {categories.length === 0 ? (
                            <option value="">لا يوجد قوائم</option>
                        ) : (
                            categories.map(cat => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))
                        )}
                    </select>
                </div>

                <Input
                    label="صورة العنصر"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    icon={<MdImage />}
                />

                {formData.image && (
                    <div className="mt-2">
                        <p className="text-xs text-gray-400 mb-2">صورة المنتج</p>
                        <div className="w-full h-40 bg-gray-900 rounded-lg overflow-hidden">
                            <img
                                src={formData.image}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => e.target.src = ""}
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        إلغاء
                    </Button>
                    <Button variant="success" type="submit" icon={<MdSave />} disabled={loading}>
                        {loading ? "Saving..." : editingItem ? "تحديث العنصر" : "أضف العنصر"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

// ============= MAIN MENU TAB =============

const MenuTab = () => {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    // Load data
    const loadMenuData = async () => {
        setLoading(true);
        try {
            const res = await getMenus();
            const menus = res?.data?.data || [];

            // Transform menus to categories and items
            const cats = menus.map(m => ({ name: m.name, _id: m._id, id: m.id }));
            const flatItems = menus.flatMap(m =>
                (m.items || []).map(it => ({
                    ...it,
                    category: m.name,
                    menuId: m._id
                }))
            );

            setCategories(cats);
            setItems(flatItems);
        } catch (error) {
            console.error("Failed to load menu data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenuData();
    }, []);

    // Add category
    const handleAddCategory = async (categoryData) => {
        try {
            const res = await addCategory(categoryData);
            await loadMenuData(); // Reload to get fresh data
        } catch (error) {
            console.error("Failed to add category:", error);
            alert("Failed to add category. Please try again.");
        }
    };

    // Add/Edit item
    const handleSaveItem = async (itemData) => {
        try {
            if (editingItem) {
                // For editing, we'd need an update endpoint
                // For now, delete and re-add
                await deleteMenuItem(editingItem.menuId, editingItem.id);
            }

            await addMenuItem({
                name: itemData.name,
                price: itemData.price,
                category: itemData.category,
                image: itemData.image
            });

            await loadMenuData();
        } catch (error) {
            console.error("Failed to save item:", error);
            alert("Failed to save item. Please try again.");
        }
    };

    // Delete category
    const handleDeleteCategory = async (category) => {
        if (!confirm(`Delete category "${category.name}" and all its items?`)) return;

        try {
            await deleteCategory(category._id);
            await loadMenuData();
        } catch (error) {
            console.error("Failed to delete category:", error);
            alert("Failed to delete category. Please try again.");
        }
    };

    // Delete item
    const handleDeleteItem = async (item) => {
        if (!confirm(`Delete "${item.name}"?`)) return;

        try {
            await deleteMenuItem(item.menuId, item.id);
            await loadMenuData();
        } catch (error) {
            console.error("Failed to delete item:", error);
            alert("Failed to delete item. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-gray-400">Loading menu...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">إدارة القائمة</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        أضف، حرر، واحذف الفئات والعناصر في قائمتك بسهولة.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => setShowCategoryModal(true)}
                        variant="primary"
                        icon={<MdAdd />}
                    >
                        أضف فئة
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingItem(null);
                            setShowItemModal(true);
                        }}
                        variant="success"
                        icon={<MdAdd />}
                    >
                        أضف عنصر
                    </Button>
                </div>
            </div>

            {/* Categories with items */}
            {categories.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <MdRestaurantMenu size={64} className="mx-auto text-gray-700 mb-4" />
                        <p className="text-gray-400 mb-4">No categories yet</p>
                        <Button
                            onClick={() => setShowCategoryModal(true)}
                            variant="primary"
                            icon={<MdAdd />}
                        >
                            Create Your First Category
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    {categories.map(category => {
                        const categoryItems = items.filter(i => i.menuId === category._id);

                        return (
                            <Card
                                key={category._id}
                                title={`${category.name} (${categoryItems.length} items)`}
                                actions={
                                    <button
                                        onClick={() => handleDeleteCategory(category)}
                                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition-colors"
                                    >
                                        <MdDelete size={20} />
                                    </button>
                                }
                            >
                                {categoryItems.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No items in this category yet
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {categoryItems.map(item => (
                                            <MenuItemCard
                                                key={item.id}
                                                item={item}
                                                onEdit={(it) => {
                                                    setEditingItem(it);
                                                    setShowItemModal(true);
                                                }}
                                                onDelete={handleDeleteItem}
                                            />
                                        ))}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                }}
                onSubmit={handleAddCategory}
                editingCategory={editingCategory}
            />

            <ItemModal
                isOpen={showItemModal}
                onClose={() => {
                    setShowItemModal(false);
                    setEditingItem(null);
                }}
                onSubmit={handleSaveItem}
                categories={categories}
                editingItem={editingItem}
            />
        </div>
    );
};

export default MenuTab;