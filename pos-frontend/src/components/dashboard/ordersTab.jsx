import React, { useState, useEffect } from "react";
import {
    MdSearch,
    MdFilterList,
    MdRefresh,
    MdDownload,
    MdVisibility,
    MdEdit,
    MdDelete,
    MdClose,
    MdCalendarToday,
    MdPerson,
    MdPayment,
    MdReceipt
} from "react-icons/md";
import { getOrders } from "../../https/index";

// ============= SHARED UI COMPONENTS =============

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
    if (!isOpen) return null;
    const sizes = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };

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
        warning: "bg-yellow-600",
        danger: "bg-red-600",
        info: "bg-blue-600"
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
};

const Input = ({ icon, value, onChange, ...props }) => (
    <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
            value={value}
            onChange={onChange}
            {...props}
            className={`w-full px-3 py-2 ${icon ? 'pl-10' : ''} bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
        />
    </div>
);

// ============= ORDER DETAILS MODAL =============

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
    if (!order) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Order Details - ${order.orderNumber}`} size="lg">
            <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-[#0f0f0f] rounded-lg">
                    <div>
                        <div className="text-xs text-gray-400">Order Number</div>
                        <div className="font-mono font-semibold text-white">{order.orderNumber}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Date & Time</div>
                        <div className="text-white">{new Date(order.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Cashier</div>
                        <div className="text-white">{order.cashier?.name || 'Unknown'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Payment Method</div>
                        <Badge variant={order.paymentMethod === 'cash' ? 'success' : 'info'}>
                            {order.paymentMethod}
                        </Badge>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Status</div>
                        <Badge variant={
                            order.status === 'completed' ? 'success' :
                                order.status === 'refunded' ? 'danger' : 'warning'
                        }>
                            {order.status}
                        </Badge>
                    </div>
                    {order.session && (
                        <div>
                            <div className="text-xs text-gray-400">Session ID</div>
                            <div className="font-mono text-sm text-white">{order.session}</div>
                        </div>
                    )}
                </div>

                {/* Items */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Order Items</h4>
                    <div className="space-y-2">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-[#0f0f0f] rounded">
                                <div>
                                    <div className="font-medium text-white">{item.name}</div>
                                    <div className="text-xs text-gray-400">Qty: {item.quantity}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-white">${(item.price * item.quantity).toFixed(2)}</div>
                                    <div className="text-xs text-gray-400">${item.price.toFixed(2)} each</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bills */}
                <div className="p-4 bg-[#0f0f0f] rounded-lg">
                    <div className="space-y-2">
                        <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span>
                            <span>${order.bills.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Tax</span>
                            <span>${order.bills.tax.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-700 pt-2 mt-2"></div>
                        <div className="flex justify-between text-xl font-bold text-white">
                            <span>Total</span>
                            <span>${order.bills.totalWithTax.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Refund Info */}
                {order.status === 'refunded' && (
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                        <div className="text-red-400 font-semibold mb-2">Refunded Order</div>
                        {order.refundedAt && (
                            <div className="text-sm text-gray-300">
                                Refunded on: {new Date(order.refundedAt).toLocaleString()}
                            </div>
                        )}
                        {order.refundReason && (
                            <div className="text-sm text-gray-300 mt-1">
                                Reason: {order.refundReason}
                            </div>
                        )}
                    </div>
                )}

                {/* Edit History */}
                {order.editHistory && order.editHistory.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Edit History</h4>
                        <div className="space-y-2">
                            {order.editHistory.map((edit, idx) => (
                                <div key={idx} className="p-3 bg-[#0f0f0f] rounded text-sm">
                                    <div className="text-gray-400">
                                        Edited on {new Date(edit.editedAt).toLocaleString()}
                                    </div>
                                    {edit.reason && <div className="text-gray-300 mt-1">{edit.reason}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Receipt */}
                {order.receipt && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Receipt</h4>
                        <div className="p-4 bg-[#0f0f0f] rounded-lg font-mono text-xs whitespace-pre-wrap text-gray-300">
                            {order.receipt.content}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

// ============= STATS CARDS =============

const StatsCard = ({ label, value, icon, color = "blue" }) => {
    const colors = {
        blue: "text-blue-400 bg-blue-900/20 border-blue-800",
        green: "text-green-400 bg-green-900/20 border-green-800",
        orange: "text-orange-400 bg-orange-900/20 border-orange-800",
        purple: "text-purple-400 bg-purple-900/20 border-purple-800"
    };

    return (
        <div className={`p-4 rounded-lg border ${colors[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-gray-400 mb-1">{label}</div>
                    <div className={`text-2xl font-bold ${colors[color].split(' ')[0]}`}>{value}</div>
                </div>
                {icon && <div className={colors[color].split(' ')[0]}>{icon}</div>}
            </div>
        </div>
    );
};

// ============= MAIN ORDERS TAB =============

const OrdersTab = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        search: "",
        dateFrom: "",
        dateTo: "",
        cashier: "",
        paymentMethod: "",
        status: ""
    });

    // Load orders
    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await getOrders();
            const ordersData = res?.data?.data || [];
            // Populate cashier info if needed
            setOrders(ordersData);
            setFilteredOrders(ordersData);
        } catch (error) {
            console.error("Failed to load orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    // Apply filters
    useEffect(() => {
        let result = [...orders];

        // Search filter (order number, customer name)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(o =>
                o.orderNumber?.toLowerCase().includes(searchLower) ||
                o.cashier?.name?.toLowerCase().includes(searchLower)
            );
        }

        // Date filters
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            result = result.filter(o => new Date(o.createdAt) >= fromDate);
        }
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            result = result.filter(o => new Date(o.createdAt) <= toDate);
        }

        // Cashier filter
        if (filters.cashier) {
            result = result.filter(o => o.cashier?._id === filters.cashier);
        }

        // Payment method filter
        if (filters.paymentMethod) {
            result = result.filter(o => o.paymentMethod === filters.paymentMethod);
        }

        // Status filter
        if (filters.status) {
            result = result.filter(o => o.status === filters.status);
        }

        setFilteredOrders(result);
    }, [filters, orders]);

    // Calculate stats
    const stats = {
        total: filteredOrders.length,
        revenue: filteredOrders.reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0),
        cashOrders: filteredOrders.filter(o => o.paymentMethod === 'cash').length,
        refunded: filteredOrders.filter(o => o.status === 'refunded').length
    };

    // Get unique cashiers for filter
    const cashiers = [...new Map(orders.map(o => [o.cashier?._id, o.cashier])).values()].filter(Boolean);

    const clearFilters = () => {
        setFilters({
            search: "",
            dateFrom: "",
            dateTo: "",
            cashier: "",
            paymentMethod: "",
            status: ""
        });
    };

    const exportToCSV = () => {
        const headers = ["Order Number", "Date", "Cashier", "Items", "Total", "Payment", "Status"];
        const rows = filteredOrders.map(o => [
            o.orderNumber,
            new Date(o.createdAt).toLocaleString(),
            o.cashier?.name || '',
            o.items.length,
            o.bills?.totalWithTax.toFixed(2),
            o.paymentMethod,
            o.status
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-gray-400">Loading orders...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Orders Management</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        View and manage all orders with advanced filtering
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={loadOrders} variant="ghost" icon={<MdRefresh />}>
                        Refresh
                    </Button>
                    <Button onClick={exportToCSV} variant="primary" icon={<MdDownload />}>
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    label="Total Orders"
                    value={stats.total}
                    icon={<MdReceipt size={32} />}
                    color="blue"
                />
                <StatsCard
                    label="Total Revenue"
                    value={`$${stats.revenue.toFixed(2)}`}
                    icon={<MdPayment size={32} />}
                    color="green"
                />
                <StatsCard
                    label="Cash Orders"
                    value={stats.cashOrders}
                    color="orange"
                />
                <StatsCard
                    label="Refunded"
                    value={stats.refunded}
                    color="purple"
                />
            </div>

            {/* Filters */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                    <MdFilterList size={20} className="text-blue-400" />
                    <h3 className="font-semibold text-white">Filters</h3>
                    {Object.values(filters).some(v => v) && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto text-sm text-blue-400 hover:text-blue-300"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Search */}
                    <Input
                        icon={<MdSearch />}
                        placeholder="Search orders..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />

                    {/* Date From */}
                    <Input
                        type="date"
                        placeholder="From Date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />

                    {/* Date To */}
                    <Input
                        type="date"
                        placeholder="To Date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    />

                    {/* Cashier */}
                    <select
                        value={filters.cashier}
                        onChange={(e) => setFilters({ ...filters, cashier: e.target.value })}
                        className="px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Cashiers</option>
                        {cashiers.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>

                    {/* Payment Method */}
                    <select
                        value={filters.paymentMethod}
                        onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                        className="px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Payments</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bankok">Bankok</option>
                    </select>

                    {/* Status */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="refunded">Refunded</option>
                        <option value="voided">Voided</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <MdReceipt size={64} className="mx-auto text-gray-700 mb-4" />
                        <p className="text-gray-400">No orders found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#0f0f0f] border-b border-gray-800">
                                <tr>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Order #</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Date & Time</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Cashier</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Items</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Total</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Payment</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="border-b border-gray-800 hover:bg-[#0f0f0f] transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="font-mono font-semibold text-blue-400">{order.orderNumber}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-300">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-sm text-gray-300">
                                            {order.cashier?.name || 'Unknown'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-300">
                                            {order.items.length} items
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-green-400">
                                                ${order.bills?.totalWithTax.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={order.paymentMethod === 'cash' ? 'success' : 'info'}>
                                                {order.paymentMethod}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={
                                                order.status === 'completed' ? 'success' :
                                                    order.status === 'refunded' ? 'danger' : 'warning'
                                            }>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowDetails(true);
                                                }}
                                                className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded transition-colors"
                                            >
                                                <MdVisibility size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={showDetails}
                onClose={() => {
                    setShowDetails(false);
                    setSelectedOrder(null);
                }}
                order={selectedOrder}
            />
        </div>
    );
};

export default OrdersTab;