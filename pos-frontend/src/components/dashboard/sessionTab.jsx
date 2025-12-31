import React, { useState, useEffect } from "react";
import {
    MdFilterList,
    MdRefresh,
    MdVisibility,
    MdClose,
    MdAccessTime,
    MdPerson,
    MdAttachMoney,
    MdShoppingCart,
    MdTrendingUp,
    MdTrendingDown,
    MdDownload
} from "react-icons/md";

// Import actual API function
// Add this to your https/index.js if not already there:
// export const getSessions = () => axiosWrapper.get('/api/session');

import { getSessions } from "../../https/index";



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
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
};

const Input = ({ value, onChange, ...props }) => (
    <input
        value={value}
        onChange={onChange}
        {...props}
        className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
    />
);

// ============= SESSION DETAILS MODAL =============

const SessionDetailsModal = ({ isOpen, onClose, session }) => {
    if (!session) return null;

    const duration = session.endedAt
        ? Math.floor((new Date(session.endedAt) - new Date(session.startedAt)) / 1000 / 60)
        : Math.floor((new Date() - new Date(session.startedAt)) / 1000 / 60);

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Session Details - ${session.cashier?.name}`} size="lg">
            <div className="space-y-6">
                {/* Session Header */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-[#0f0f0f] rounded-lg">
                    <div>
                        <div className="text-xs text-gray-400">Cashier</div>
                        <div className="font-semibold text-white">{session.cashier?.name}</div>
                        <div className="text-xs text-gray-500">{session.cashier?.email}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Status</div>
                        <Badge variant={session.status === 'open' ? 'success' : 'default'}>
                            {session.status}
                        </Badge>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Started</div>
                        <div className="text-white text-sm">{new Date(session.startedAt).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Ended</div>
                        <div className="text-white text-sm">
                            {session.endedAt ? new Date(session.endedAt).toLocaleString() : 'In Progress'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Duration</div>
                        <div className="text-white text-sm">{hours}h {minutes}m</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Total Orders</div>
                        <div className="text-white text-2xl font-bold">{session.totalOrders || 0}</div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                        <div className="text-xs text-green-400 mb-2">Revenue</div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total Sales</span>
                                <span className="text-white font-semibold">${(session.totalSales || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Cash Collected</span>
                                <span className="text-white font-semibold">${(session.totalCashCollected || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                        <div className="text-xs text-red-400 mb-2">Balance</div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Starting</span>
                                <span className="text-white font-semibold">${(session.startingBalance || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Expenses</span>
                                <span className="text-white font-semibold">${(session.totalExpenses || 0).toFixed(2)}</span>
                            </div>
                            {session.endBalance !== undefined && session.endBalance > 0 && (
                                <div className="flex justify-between text-sm border-t border-red-700 pt-2">
                                    <span className="text-gray-400">End Balance</span>
                                    <span className="text-white font-bold">${session.endBalance.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-[#0f0f0f] rounded-lg text-center">
                        <div className="text-xs text-gray-400 mb-1">Avg Order</div>
                        <div className="text-xl font-bold text-blue-400">
                            ${session.totalOrders > 0 ? ((session.totalSales || 0) / session.totalOrders).toFixed(2) : '0.00'}
                        </div>
                    </div>
                    <div className="p-4 bg-[#0f0f0f] rounded-lg text-center">
                        <div className="text-xs text-gray-400 mb-1">Orders/Hour</div>
                        <div className="text-xl font-bold text-purple-400">
                            {hours > 0 ? ((session.totalOrders || 0) / hours).toFixed(1) : (session.totalOrders || 0)}
                        </div>
                    </div>
                    <div className="p-4 bg-[#0f0f0f] rounded-lg text-center">
                        <div className="text-xs text-gray-400 mb-1">Sales/Hour</div>
                        <div className="text-xl font-bold text-green-400">
                            ${hours > 0 ? ((session.totalSales || 0) / hours).toFixed(2) : (session.totalSales || 0).toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Comment */}
                {session.comment && (
                    <div className="p-4 bg-[#0f0f0f] rounded-lg">
                        <div className="text-xs text-gray-400 mb-2">Comment</div>
                        <div className="text-white text-sm">{session.comment}</div>
                    </div>
                )}

                {/* Expenses */}
                {session.expenses && session.expenses.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Expenses</h4>
                        <div className="space-y-2">
                            {session.expenses.map((expense, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-[#0f0f0f] rounded">
                                    <div>
                                        <div className="text-white">{expense.description || 'No description'}</div>
                                        {expense.createdAt && (
                                            <div className="text-xs text-gray-400">
                                                {new Date(expense.createdAt).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-semibold text-red-400">${expense.amount.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Operations Log */}
                {session.operations && session.operations.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Activity Log</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {session.operations.map((op, idx) => (
                                <div key={idx} className="p-3 bg-[#0f0f0f] rounded text-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="text-white font-medium capitalize">
                                                {op.type.replace(/_/g, ' ')}
                                            </div>
                                            {op.details && Object.keys(op.details).length > 0 && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {Object.entries(op.details).map(([key, value]) => (
                                                        <div key={key}>
                                                            {key}: {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {op.createdAt && (
                                            <div className="text-xs text-gray-500">
                                                {new Date(op.createdAt).toLocaleTimeString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

// ============= SESSION CARD =============

const SessionCard = ({ session, onClick }) => {
    const isOpen = session.status === 'open';
    const duration = session.endedAt
        ? Math.floor((new Date(session.endedAt) - new Date(session.startedAt)) / 1000 / 60)
        : Math.floor((new Date() - new Date(session.startedAt)) / 1000 / 60);

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    const avgOrderValue = session.totalOrders > 0
        ? ((session.totalSales || 0) / session.totalOrders).toFixed(2)
        : '0.00';

    return (
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-semibold text-white">{session.cashier?.name || 'Unknown'}</h3>
                        <Badge variant={isOpen ? 'success' : 'default'}>
                            {session.status}
                        </Badge>
                    </div>
                    <div className="text-sm text-gray-400">{session.cashier?.email}</div>
                </div>
                <button
                    onClick={onClick}
                    className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded transition-colors"
                >
                    <MdVisibility size={20} />
                </button>
            </div>

            {/* Time Info */}
            <div className="mb-4 p-3 bg-[#0f0f0f] rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <MdAccessTime size={16} />
                    <span>Started: {new Date(session.startedAt).toLocaleString()}</span>
                </div>
                {session.endedAt && (
                    <div className="text-sm text-gray-400">
                        Ended: {new Date(session.endedAt).toLocaleString()}
                    </div>
                )}
                <div className="text-sm text-white mt-1">
                    Duration: {hours}h {minutes}m
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 bg-[#0f0f0f] rounded">
                    <div className="text-xs text-gray-400">Orders</div>
                    <div className="text-lg font-bold text-white">{session.totalOrders || 0}</div>
                </div>
                <div className="text-center p-3 bg-[#0f0f0f] rounded">
                    <div className="text-xs text-gray-400">Sales</div>
                    <div className="text-lg font-bold text-green-400">${(session.totalSales || 0).toFixed(2)}</div>
                </div>
                <div className="text-center p-3 bg-[#0f0f0f] rounded">
                    <div className="text-xs text-gray-400">Cash</div>
                    <div className="text-lg font-bold text-blue-400">${(session.totalCashCollected || 0).toFixed(2)}</div>
                </div>
                <div className="text-center p-3 bg-[#0f0f0f] rounded">
                    <div className="text-xs text-gray-400">Avg Order</div>
                    <div className="text-lg font-bold text-purple-400">${avgOrderValue}</div>
                </div>
            </div>

            {/* Balance Row */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                <div className="flex gap-4 text-sm">
                    <div>
                        <span className="text-gray-400">Start: </span>
                        <span className="text-white font-semibold">${(session.startingBalance || 0).toFixed(2)}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">Expenses: </span>
                        <span className="text-red-400 font-semibold">${(session.totalExpenses || 0).toFixed(2)}</span>
                    </div>
                </div>
                {session.endBalance !== undefined && session.endBalance > 0 && (
                    <div>
                        <span className="text-gray-400 text-sm">End: </span>
                        <span className="text-white font-bold">${session.endBalance.toFixed(2)}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============= STATS CARD =============

const StatsCard = ({ label, value, icon, color = "blue" }) => {
    const colors = {
        blue: "text-blue-400 bg-blue-900/20 border-blue-800",
        green: "text-green-400 bg-green-900/20 border-green-800",
        orange: "text-orange-400 bg-orange-900/20 border-orange-800",
        purple: "text-purple-400 bg-purple-900/20 border-purple-800"
    };

    return (
        <div className={`p-4 rounded-lg border ${colors[color]}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-400">{label}</div>
                {icon && <div className={colors[color].split(' ')[0]}>{icon}</div>}
            </div>
            <div className={`text-2xl font-bold ${colors[color].split(' ')[0]}`}>{value}</div>
        </div>
    );
};

// ============= MAIN SESSIONS TAB =============

const SessionsTab = () => {
    const [sessions, setSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        cashier: "",
        status: "",
        dateFrom: "",
        dateTo: ""
    });

    // Load sessions
    const loadSessions = async () => {
        setLoading(true);
        try {
            const res = await getSessions();
            const sessionsData = res?.data?.data || [];
            setSessions(sessionsData);
            setFilteredSessions(sessionsData);
        } catch (error) {
            console.error("Failed to load sessions:", error);
            alert("Failed to load sessions. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    // Apply filters
    useEffect(() => {
        let result = [...sessions];

        if (filters.cashier) {
            result = result.filter(s => s.cashier?._id === filters.cashier);
        }

        if (filters.status) {
            result = result.filter(s => s.status === filters.status);
        }

        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            result = result.filter(s => new Date(s.startedAt) >= fromDate);
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            result = result.filter(s => new Date(s.startedAt) <= toDate);
        }

        setFilteredSessions(result);
    }, [filters, sessions]);

    // Calculate stats
    const stats = {
        total: filteredSessions.length,
        active: filteredSessions.filter(s => s.status === 'open').length,
        totalRevenue: filteredSessions.reduce((sum, s) => sum + (s.totalSales || 0), 0),
        totalOrders: filteredSessions.reduce((sum, s) => sum + (s.totalOrders || 0), 0)
    };

    // Get unique cashiers
    const cashiers = [...new Map(sessions.map(s => [s.cashier?._id, s.cashier])).values()].filter(Boolean);

    const clearFilters = () => {
        setFilters({ cashier: "", status: "", dateFrom: "", dateTo: "" });
    };

    const exportToCSV = () => {
        const headers = ["Cashier", "Started", "Ended", "Duration (min)", "Orders", "Sales", "Cash", "Expenses", "End Balance", "Status"];
        const rows = filteredSessions.map(s => {
            const duration = s.endedAt
                ? Math.floor((new Date(s.endedAt) - new Date(s.startedAt)) / 1000 / 60)
                : Math.floor((new Date() - new Date(s.startedAt)) / 1000 / 60);

            return [
                s.cashier?.name || '',
                new Date(s.startedAt).toLocaleString(),
                s.endedAt ? new Date(s.endedAt).toLocaleString() : 'In Progress',
                duration,
                s.totalOrders || 0,
                (s.totalSales || 0).toFixed(2),
                (s.totalCashCollected || 0).toFixed(2),
                (s.totalExpenses || 0).toFixed(2),
                (s.endBalance || 0).toFixed(2),
                s.status
            ];
        });

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sessions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-gray-400">Loading sessions...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Session Management</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Track and analyze cashier sessions with detailed reports
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={loadSessions} variant="ghost" icon={<MdRefresh />}>
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
                    label="Total Sessions"
                    value={stats.total}
                    icon={<MdAccessTime size={32} />}
                    color="blue"
                />
                <StatsCard
                    label="Active Now"
                    value={stats.active}
                    icon={<MdPerson size={32} />}
                    color="green"
                />
                <StatsCard
                    label="Total Revenue"
                    value={`$${stats.totalRevenue.toFixed(2)}`}
                    icon={<MdAttachMoney size={32} />}
                    color="purple"
                />
                <StatsCard
                    label="Total Orders"
                    value={stats.totalOrders}
                    icon={<MdShoppingCart size={32} />}
                    color="orange"
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>

                    <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        placeholder="From Date"
                    />

                    <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        placeholder="To Date"
                    />
                </div>
            </div>

            {/* Sessions List */}
            {filteredSessions.length === 0 ? (
                <div className="bg-[#1a1a1a] rounded-xl p-12 border border-gray-800 text-center">
                    <MdAccessTime size={64} className="mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-400">No sessions found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredSessions.map((session) => (
                        <SessionCard
                            key={session._id}
                            session={session}
                            onClick={() => {
                                setSelectedSession(session);
                                setShowDetails(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Session Details Modal */}
            <SessionDetailsModal
                isOpen={showDetails}
                onClose={() => {
                    setShowDetails(false);
                    setSelectedSession(null);
                }}
                session={selectedSession}
            />
        </div>
    );
};

export default SessionsTab;