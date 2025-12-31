import React, { useState, useEffect } from "react";
import {
    MdAdd,
    MdEdit,
    MdDelete,
    MdClose,
    MdPerson,
    MdEmail,
    MdPhone,
    MdLock,
    MdRefresh,
    MdSearch,
    MdSave
} from "react-icons/md";

// API functions - Add these to your https/index.js:
// export const getUsers = () => axiosWrapper.get('/api/user/all');
// export const updateUser = ({ userId, ...userData }) => axiosWrapper.put(`/api/user/${userId}`, userData);
// export const deleteUser = (userId) => axiosWrapper.delete(`/api/user/${userId}`);

import { getUsers, updateUser , deleteUser , register } from "../../https/index";



// ============= SHARED UI COMPONENTS =============

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
    if (!isOpen) return null;
    const sizes = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className={`bg-[#1a1a1a] rounded-xl ${sizes[size]} w-full max-h-[90vh] overflow-y-auto shadow-2xl`}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-[#1a1a1a] z-10">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded">
                        <MdClose size={24} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const Button = ({ onClick, children, variant = "primary", icon, className = "", disabled = false }) => {
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700",
        success: "bg-green-600 hover:bg-green-700",
        danger: "bg-red-600 hover:bg-red-700",
        ghost: "bg-transparent hover:bg-gray-800 border border-gray-700"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        >
            {icon}
            {children}
        </button>
    );
};

const Badge = ({ children, variant = "default" }) => {
    const variants = {
        default: "bg-gray-600",
        success: "bg-green-600",
        info: "bg-blue-600",
        warning: "bg-yellow-600"
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
};

const Input = ({ label, error, icon, value, onChange, ...props }) => (
    <div className="space-y-2">
        {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
        <div className="relative">
            {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</div>}
            <input
                value={value}
                onChange={onChange}
                {...props}
                className={`w-full px-3 py-2.5 ${icon ? 'pl-10' : ''} bg-[#0f0f0f] border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${error ? "border-red-500" : "border-gray-700"
                    }`}
            />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
);

// ============= USER MODAL =============

const UserModal = ({ isOpen, onClose, onSubmit, editingUser }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "cashier",
        cashierCode: ""
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingUser) {
            setFormData({
                name: editingUser.name,
                email: editingUser.email,
                phone: editingUser.phone,
                password: "", // Don't show existing password
                role: editingUser.role,
                cashierCode: editingUser.cashierCode
            });
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                password: "",
                role: "cashier",
                cashierCode: ""
            });
        }
        setErrors({});
    }, [editingUser, isOpen]);

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (!formData.phone) {
            newErrors.phone = "Phone is required";
        } else if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = "Phone must be 10 digits";
        }

        if (!editingUser && !formData.password) {
            newErrors.password = "Password is required";
        }

        if (!formData.cashierCode.trim()) {
            newErrors.cashierCode = "Cashier code is required";
        } else if (!/^[A-Z]\d+$/.test(formData.cashierCode.toUpperCase())) {
            newErrors.cashierCode = "Format: A1, B1, etc.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const submitData = {
                ...formData,
                cashierCode: formData.cashierCode.toUpperCase()
            };

            // Remove password if empty (for updates)
            if (editingUser && !submitData.password) {
                delete submitData.password;
            }

            await onSubmit(submitData);
            onClose();
        } catch (error) {
            console.error("Failed to save user:", error);
            alert(error.response?.data?.message || "Failed to save user. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingUser ? "Edit User" : "Add New User"} size="md">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Full Name"
                        icon={<MdPerson />}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        error={errors.name}
                        autoFocus
                    />

                    <Input
                        label="Email"
                        type="email"
                        icon={<MdEmail />}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        error={errors.email}
                    />

                    <Input
                        label="Phone"
                        type="tel"
                        icon={<MdPhone />}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="1234567890"
                        error={errors.phone}
                    />

                    <Input
                        label="Cashier Code"
                        value={formData.cashierCode}
                        onChange={(e) => setFormData({ ...formData, cashierCode: e.target.value.toUpperCase() })}
                        placeholder="A1, B1, etc."
                        error={errors.cashierCode}
                    />
                </div>

                <Input
                    label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                    type="password"
                    icon={<MdLock />}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                    error={errors.password}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setFormData({ ...formData, role: "cashier" })}
                            className={`p-4 rounded-lg border-2 transition-all ${formData.role === "cashier"
                                    ? "border-blue-500 bg-blue-900/20"
                                    : "border-gray-700 hover:border-gray-600"
                                }`}
                        >
                            <div className="text-center">
                                <div className="text-2xl mb-2">👤</div>
                                <div className="font-semibold text-white">Cashier</div>
                                <div className="text-xs text-gray-400 mt-1">Regular user</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setFormData({ ...formData, role: "manager" })}
                            className={`p-4 rounded-lg border-2 transition-all ${formData.role === "manager"
                                    ? "border-blue-500 bg-blue-900/20"
                                    : "border-gray-700 hover:border-gray-600"
                                }`}
                        >
                            <div className="text-center">
                                <div className="text-2xl mb-2">👔</div>
                                <div className="font-semibold text-white">Manager</div>
                                <div className="text-xs text-gray-400 mt-1">Admin access</div>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleSubmit}
                        icon={<MdSave />}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : editingUser ? "Update User" : "Create User"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// ============= MAIN USERS TAB =============

const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    // Load users
    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await getUsers();
            const usersData = res?.data?.data || [];
            setUsers(usersData);
            setFilteredUsers(usersData);
        } catch (error) {
            console.error("Failed to load users:", error);
            alert("Failed to load users. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Apply filters
    useEffect(() => {
        let result = [...users];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(u =>
                u.name?.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.cashierCode?.toLowerCase().includes(query)
            );
        }

        // Role filter
        if (roleFilter) {
            result = result.filter(u => u.role === roleFilter);
        }

        setFilteredUsers(result);
    }, [searchQuery, roleFilter, users]);

    // Add/Update user
    const handleSaveUser = async (userData) => {
        if (editingUser) {
            // Update existing user
            await updateUser({ userId: editingUser._id, ...userData });
        } else {
            // Create new user
            await register(userData);
        }
        await loadUsers();
        setShowUserModal(false);
        setEditingUser(null);
    };

    // Delete user
    const handleDeleteUser = async (userId) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return;
        }

        try {
            await deleteUser(userId);
            await loadUsers();
        } catch (error) {
            console.error("Failed to delete user:", error);
            alert("Failed to delete user. Please try again.");
        }
    };

    const stats = {
        total: users.length,
        cashiers: users.filter(u => u.role === 'cashier').length,
        managers: users.filter(u => u.role === 'manager').length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-gray-400">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">User Management</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Manage cashiers and managers
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={loadUsers} variant="ghost" icon={<MdRefresh />}>
                        Refresh
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingUser(null);
                            setShowUserModal(true);
                        }}
                        variant="success"
                        icon={<MdAdd />}
                    >
                        Add User
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Total Users</div>
                    <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
                </div>
                <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Cashiers</div>
                    <div className="text-3xl font-bold text-green-400">{stats.cashiers}</div>
                </div>
                <div className="p-4 bg-purple-900/20 border border-purple-800 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Managers</div>
                    <div className="text-3xl font-bold text-purple-400">{stats.managers}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Roles</option>
                        <option value="cashier">Cashiers</option>
                        <option value="manager">Managers</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
                <div className="bg-[#1a1a1a] rounded-xl p-12 border border-gray-800 text-center">
                    <MdPerson size={64} className="mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-400">No users found</p>
                </div>
            ) : (
                <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#0f0f0f] border-b border-gray-800">
                                <tr>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Name</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Email</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Phone</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Code</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Role</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Joined</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user._id}
                                        className="border-b border-gray-800 hover:bg-[#0f0f0f] transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="font-medium text-white">{user.name}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-300">{user.email}</td>
                                        <td className="p-4 text-sm text-gray-300">{user.phone}</td>
                                        <td className="p-4">
                                            <span className="font-mono text-blue-400 font-semibold">
                                                {user.cashierCode}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={user.role === 'manager' ? 'info' : 'default'}>
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setShowUserModal(true);
                                                    }}
                                                    className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded transition-colors"
                                                >
                                                    <MdEdit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition-colors"
                                                >
                                                    <MdDelete size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* User Modal */}
            <UserModal
                isOpen={showUserModal}
                onClose={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                }}
                onSubmit={handleSaveUser}
                editingUser={editingUser}
            />
        </div>
    );
};

export default UsersTab;