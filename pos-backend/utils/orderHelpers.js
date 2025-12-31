// utils/orderHelpers.js
const User = require("../models/userModel");
const Session = require("../models/sessionModel");
const Order = require("../models/orderModel");

// Generate unique order number for cashier
const generateOrderNumber = async (cashierId) => {
  try {
    // Get user to fetch cashier code
    const user = await User.findById(cashierId);
    if (!user || !user.cashierCode) {
      throw new Error("Cashier code not found");
    }

    // Get or create today's open session
    const session = await Session.findOne({ 
      cashier: cashierId, 
      status: 'open' 
    }).sort({ startedAt: -1 });

    if (!session) {
      throw new Error("No open session found");
    }

    // Check if we need to reset counter (new day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastOrderDate = session.lastOrderDate ? new Date(session.lastOrderDate) : null;
    let needsReset = false;
    
    if (lastOrderDate) {
      const lastDate = new Date(lastOrderDate);
      lastDate.setHours(0, 0, 0, 0);
      needsReset = lastDate < today;
    } else {
      needsReset = true;
    }

    let counter = needsReset ? 1 : (session.orderCounter || 0) + 1;

    // Generate order number and check for duplicates
    let orderNumber;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      orderNumber = `${user.cashierCode}-${counter.toString().padStart(3, '0')}`;
      
      // Check if order number already exists
      const existing = await Order.findOne({ orderNumber });
      
      if (!existing) {
        // Unique number found, break loop
        break;
      }
      
      // Number exists, increment and try again
      counter++;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique order number after multiple attempts");
    }

    // Update session with new counter
    session.orderCounter = counter;
    session.lastOrderDate = new Date();
    await session.save();

    return { orderNumber, sequenceNumber: counter };
  } catch (error) {
    console.error("[generateOrderNumber] error:", error);
    throw error;
  }
};

// Get recent orders for cashier (last N orders from current session)
const getRecentOrders = async (cashierId, limit = 15) => {
  try {
    // Get current open session
    const session = await Session.findOne({
      cashier: cashierId,
      status: 'open'
    }).sort({ startedAt: -1 });

    if (!session) {
      return [];
    }

    // Get orders from this session
    const orders = await Order.find({
      session: session._id,
      status: { $in: ['completed', 'refunded'] } // exclude voided
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('cashier', 'name email cashierCode')
      .populate('refundedBy', 'name email');

    return orders;
  } catch (error) {
    console.error("[getRecentOrders] error:", error);
    throw error;
  }
};

// Search order by order number
const searchOrderByNumber = async (orderNumber) => {
  try {
    const order = await Order.findOne({ orderNumber })
      .populate('cashier', 'name email cashierCode')
      .populate('refundedBy', 'name email');

    return order;
  } catch (error) {
    console.error("[searchOrderByNumber] error:", error);
    throw error;
  }
};

module.exports = {
  generateOrderNumber,
  getRecentOrders,
  searchOrderByNumber
};