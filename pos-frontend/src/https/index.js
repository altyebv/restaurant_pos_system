import { axiosWrapper } from "./axiosWrapper";

// Auth Endpoints
export const login = (data) => axiosWrapper.post("/api/user/login", data);
export const register = (data) => axiosWrapper.post("/api/user/register", data);
export const getUserData = () => axiosWrapper.get("/api/user");
export const logout = () => axiosWrapper.post("/api/user/logout");

// Order Endpoints
export const addOrder = (data) => axiosWrapper.post("/api/order/", data);
export const getOrders = () => axiosWrapper.get("/api/order");
export const getOrderById = (orderId) => axiosWrapper.get(`/api/order/${orderId}`);
export const getOrdersBySession = (sessionId, page = 1, limit = 50) => 
  axiosWrapper.get(`/api/order/session/${sessionId}?page=${page}&limit=${limit}`);

// Menu / Category Endpoints
export const getMenus = () => axiosWrapper.get('/api/menu');
export const addCategory = (data) => axiosWrapper.post('/api/menu/category', data);
export const addMenuItem = (data) => axiosWrapper.post('/api/menu/item', data);
export const updateMenuItem = (menuId, itemId, data) => 
  axiosWrapper.put(`/api/menu/${menuId}/item/${itemId}`, data);
export const deleteCategory = (menuId) => axiosWrapper.delete(`/api/menu/${menuId}`);
export const deleteMenuItem = (menuId, itemId) => 
  axiosWrapper.delete(`/api/menu/${menuId}/item/${itemId}`);

// Session Endpoints
export const getCurrentSession = () => axiosWrapper.get('/api/session/current');
export const openSession = (data) => axiosWrapper.post('/api/session/open', data);
export const closeSession = (data) => axiosWrapper.post('/api/session/close', data);
export const addExpense = (sessionId, data) => 
  axiosWrapper.post(`/api/session/${sessionId}/expense`, data);
export const getSessions = () => axiosWrapper.get('/api/session');
export const getSessionById = (sessionId) => axiosWrapper.get(`/api/session/${sessionId}`);

// User Management Endpoints
export const getUsers = () => axiosWrapper.get('/api/user/all');
export const updateUser = ({ userId, ...userData }) => 
  axiosWrapper.put(`/api/user/${userId}`, userData);
export const deleteUser = (userId) => 
  axiosWrapper.delete(`/api/user/${userId}`);

// Order Management Endpoints
export const getRecentOrders = (limit = 15) => 
  axiosWrapper.get(`/api/order/recent?limit=${limit}`);

export const searchOrderByNumber = (orderNumber) => 
  axiosWrapper.get(`/api/order/search?orderNumber=${orderNumber}`);

export const editOrder = ({ orderId, items, bills, reason }) => 
  axiosWrapper.put(`/api/order/${orderId}/edit`, { items, bills, reason });

export const refundOrder = ({ orderId, reason }) => 
  axiosWrapper.post(`/api/order/${orderId}/refund`, { reason });