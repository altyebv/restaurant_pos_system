import React, { useState, useEffect } from "react";
import { 
  MdPeople, 
  MdAssessment, 
  MdReceipt,
  MdAccessTime,
  MdRestaurantMenu
} from "react-icons/md";
import MenuTab from "../components/dashboard/menuTab";
import OrdersTab from "../components/dashboard/ordersTab";
import SessionTab from "../components/dashboard/sessionTab";
import UsersTab from "../components/dashboard/usersTab";

// Mock API calls - replace with your actual API
const mockAPI = {
  fetchUsers: async () => [
    { _id: '1', name: 'John Doe', email: 'john@example.com', phone: '1234567890', role: 'cashier', cashierCode: 'A1' },
    { _id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321', role: 'manager', cashierCode: 'M1' }
  ],
  fetchSessions: async () => [
    { _id: 's1', cashier: { _id: '1', name: 'John Doe' }, startedAt: '2024-12-29T08:00:00', endedAt: '2024-12-29T16:00:00', startingBalance: 100, totalSales: 1250, totalCashCollected: 800, totalExpenses: 50, endBalance: 850, totalOrders: 25, status: 'closed' },
    { _id: 's2', cashier: { _id: '2', name: 'Jane Smith' }, startedAt: '2024-12-30T08:00:00', endedAt: null, startingBalance: 850, totalSales: 450, totalCashCollected: 300, totalExpenses: 0, endBalance: 0, totalOrders: 8, status: 'open' }
  ],
  fetchOrders: async () => [
    { _id: 'o1', orderDate: '2024-12-29T10:30:00', customerDetails: { name: 'Customer 1' }, items: [{ name: 'Burger', quantity: 2, price: 10 }], bills: { totalWithTax: 22 }, paymentMethod: 'cash', orderStatus: 'Ready', table: { tableNo: 5 }, cashier: { _id: '1', name: 'John Doe' } },
    { _id: 'o2', orderDate: '2024-12-30T09:15:00', customerDetails: { name: 'Customer 2' }, items: [{ name: 'Pizza', quantity: 1, price: 15 }], bills: { totalWithTax: 16.5 }, paymentMethod: 'card', orderStatus: 'In Progress', table: { tableNo: 3 }, cashier: { _id: '2', name: 'Jane Smith' } }
  ],
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  
  // State
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersData, sessionsData, ordersData, categoriesData, itemsData] = await Promise.all([
          mockAPI.fetchUsers(),
          mockAPI.fetchSessions(),
          mockAPI.fetchOrders(),
          mockAPI.fetchCategories(),
          mockAPI.fetchItems()
        ]);
        
        setUsers(usersData);
        setSessions(sessionsData);
        setOrders(ordersData);
        setCategories(categoriesData);
        setItems(itemsData);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate stats for overview
  const stats = {
    totalRevenue: orders.reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0),
    todayRevenue: orders
      .filter(o => new Date(o.orderDate).toDateString() === new Date().toDateString())
      .reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0),
    weekRevenue: orders
      .filter(o => {
        const orderDate = new Date(o.orderDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate >= weekAgo;
      })
      .reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0),
    totalOrders: orders.length
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MdAssessment },
    { id: 'menu', label: 'Menu', icon: MdRestaurantMenu },
    { id: 'orders', label: 'Orders', icon: MdReceipt },
    { id: 'sessions', label: 'Sessions', icon: MdAccessTime },
    { id: 'users', label: 'Users', icon: MdPeople }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1a1a1a] border-b border-gray-800 sticky top-[73px] z-30">
        <div className="container mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <OverviewTabPlaceholder stats={stats} sessions={sessions} items={items} />
        )}
        
        {activeTab === 'menu' && (
          // <MenuTabPlaceholder categories={categories} items={items} />
          <MenuTab categories={categories} items={items} />
        )}
        
        {activeTab === 'orders' && (
          <OrdersTab/>
        )}
        
        {activeTab === 'sessions' && (
          <SessionTab sessions={sessions} users={users} />)}
        
        {activeTab === 'users' && (
          <UsersTab />
        )}

      </div>
    </div>
  );
};

// Placeholder components - we'll create proper ones next
const OverviewTabPlaceholder = ({ stats, sessions, items }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <div className="text-sm text-gray-400 mb-2">Today's Revenue</div>
        <div className="text-3xl font-bold text-green-400">${stats.todayRevenue.toFixed(2)}</div>
      </div>
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <div className="text-sm text-gray-400 mb-2">This Week</div>
        <div className="text-3xl font-bold text-blue-400">${stats.weekRevenue.toFixed(2)}</div>
      </div>
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <div className="text-sm text-gray-400 mb-2">Total Revenue</div>
        <div className="text-3xl font-bold text-purple-400">${stats.totalRevenue.toFixed(2)}</div>
      </div>
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <div className="text-sm text-gray-400 mb-2">Total Orders</div>
        <div className="text-3xl font-bold text-orange-400">{stats.totalOrders}</div>
      </div>
    </div>
    
    <div className="text-center py-8 text-gray-400">
      Overview tab - Stats cards, charts, active sessions
      <br/>Ask me to create the detailed OverviewTab component next!
    </div>
  </div>
);




const UsersTabPlaceholder = ({ users }) => (
  <div className="text-center py-8 text-gray-400">
    User Management - {users.length} users
    <br/>Ask me to create the UsersTab component!
  </div>
);

export default AdminDashboard;