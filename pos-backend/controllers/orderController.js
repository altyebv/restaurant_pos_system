// orderController.js
const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Session = require("../models/sessionModel");
const mongoose = require("mongoose");
const { generateOrderNumber, getRecentOrders, searchOrderByNumber } = require("../utils/orderHelpers");

const addOrder = async (req, res, next) => {
  try {
    console.log("[addOrder] incoming payload:", JSON.stringify(req.body));
    console.log("[addOrder] req.user:", req.user ? req.user._id : "NO USER - NOT AUTHENTICATED!");

    const { bills } = req.body || {};
    if (!bills || typeof bills.total === "undefined" || typeof bills.tax === "undefined" || typeof bills.totalWithTax === "undefined") {
      const err = createHttpError(400, "bills.total, bills.tax and bills.totalWithTax are required");
      return next(err);
    }
    
    const cafeName = "Vision Café";
    const now = new Date();
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    // Coerce numeric fields
    bills.total = Number(bills.total);
    bills.tax = Number(bills.tax);
    bills.totalWithTax = Number(bills.totalWithTax);
    items.forEach((it) => {
      if (it.quantity) it.quantity = Number(it.quantity);
      if (it.price) it.price = Number(it.price);
      if (it.pricePerQuantity) it.pricePerQuantity = Number(it.pricePerQuantity);
    });

    // Generate order number
    const { orderNumber, sequenceNumber } = await generateOrderNumber(req.user._id);

    // Build receipt
    const lines = [];
    lines.push(`Order Receipt - ${cafeName}`);
    lines.push(`Order #: ${orderNumber}`);
    lines.push(`Order Time: ${now.toLocaleString()}`);
    lines.push(`-----------------------------`);
    items.forEach((it) => {
      const name = it.name || it.title || `Item ${it.id || ""}`;
      const qty = it.quantity || it.qty || 1;
      const price = typeof it.price !== "undefined" ? it.price : it.pricePerQuantity || 0;
      lines.push(`${name} x ${qty}  -  ${price.toFixed ? price.toFixed(2) : price}`);
    });
    lines.push(`-----------------------------`);
    lines.push(`Subtotal: ${bills.total}`);
    lines.push(`Tax: ${bills.tax}`);
    lines.push(`Total: ${bills.totalWithTax}`);
    lines.push(`Payment Method: ${req.body.paymentMethod || "Unknown"}`);

    const receipt = {
      cafeName,
      content: lines.join("\n"),
      createdAt: now,
    };

    const orderPayload = Object.assign({}, req.body, { 
      receipt,
      orderNumber,
      sequenceNumber,
      cashier: req.user._id
    });
    
    // Attach open session
    if (!orderPayload.session) {
      try {
        const openSession = await Session.findOne({ cashier: req.user._id, status: 'open' }).sort({ startedAt: -1 });
        if (openSession) {
          orderPayload.session = openSession._id;
        }
      } catch (err) {
        console.warn('[addOrder] failed to find open session:', err.message || err);
      }
    }

    const order = new Order(orderPayload);
    const saved = await order.save();
    
    // Update session
    if (saved.session) {
      try {
        const updates = {
          $push: { orders: saved._id },
          $inc: { totalOrders: 1 }
        };
        
        const total = Number(saved.bills && saved.bills.totalWithTax) || 0;
        if (total > 0) {
          updates.$inc.totalSales = total;
        }
        
        if (saved.paymentMethod && saved.paymentMethod.toLowerCase() === 'cash') {
          updates.$inc.totalCashCollected = total;
        }
        
        const operation = { 
          type: 'order_created', 
          details: { 
            orderId: saved._id,
            orderNumber: saved.orderNumber,
            total, 
            paymentMethod: saved.paymentMethod
          }, 
          createdBy: saved.cashier 
        };
        updates.$push.operations = operation;
        
        await Session.findByIdAndUpdate(saved.session, updates, { new: true });
      } catch (err) {
        console.warn('[addOrder] failed to attach order to session', err.message || err);
      }
    }
    
    console.log("[addOrder] saved order:", saved.orderNumber);
    res.status(201).json({ success: true, message: "Order created!", data: saved });
  } catch (error) {
    if (error && error.name === "ValidationError") {
      const err = createHttpError(400, error.message);
      return next(err);
    }
    console.error("[addOrder] error:", error);
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findById(id);
    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("cashier", "name email cashierCode") // ADD THIS
      .sort({ createdAt: -1 }); // Optional: newest first
    res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
};

const getOrdersBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = (Math.max(page, 1) - 1) * limit;

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return next(createHttpError(404, "Invalid session id"));
    }

    const session = await Session.findById(sessionId);
    if (!session) return next(createHttpError(404, "Session not found"));

    if (req.user.role !== 'manager' && session.cashier.toString() !== req.user._id.toString()) {
      return next(createHttpError(403, "You can only view orders for your own sessions"));
    }

    const summaryAgg = await Order.aggregate([
      { $match: { session: new mongoose.Types.ObjectId(sessionId) } },
      { 
        $group: { 
          _id: null, 
          totalSales: { $sum: "$bills.totalWithTax" }, 
          totalCashCollected: { 
            $sum: { 
              $cond: [
                { $eq: ["$paymentMethod", "cash"] }, 
                "$bills.totalWithTax", 
                0
              ] 
            } 
          }, 
          count: { $sum: 1 } 
        } 
      }
    ]);
    
    const summary = summaryAgg && summaryAgg[0] ? summaryAgg[0] : { totalSales: 0, totalCashCollected: 0, count: 0 };

    const orders = await Order.find({ session: sessionId })
      .populate('table')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      data: { 
        orders, 
        totals: { 
          totalOrders: summary.count, 
          totalSales: summary.totalSales, 
          totalCashCollected: summary.totalCashCollected 
        }, 
        page, 
        limit 
      } 
    });
  } catch (error) {
    next(error);
  }
};

// Get recent orders for current cashier (for history view)
const getRecentOrdersForCashier = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 15, 50);
    const orders = await getRecentOrders(req.user._id, limit);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("[getRecentOrdersForCashier] error:", error);
    next(error);
  }
};

// Search order by order number
const searchOrder = async (req, res, next) => {
  try {
    const { orderNumber } = req.query;
    if (!orderNumber) {
      return next(createHttpError(400, "Order number is required"));
    }

    const order = await searchOrderByNumber(orderNumber);
    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    // Permission check: only manager or order creator can view
    if (req.user.role !== 'manager' && order.cashier._id.toString() !== req.user._id.toString()) {
      return next(createHttpError(403, "You can only view your own orders"));
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Edit order (update items/bills)
// In orderController.js - Replace editOrder function

const editOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, bills, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid order ID"));
    }

    const order = await Order.findById(id);
    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    // Can't edit refunded orders
    if (order.status === 'refunded') {
      return next(createHttpError(400, "Cannot edit a refunded order"));
    }

    // Permission check
    if (req.user.role !== 'manager' && order.cashier.toString() !== req.user._id.toString()) {
      return next(createHttpError(403, "You can only edit your own orders"));
    }

    // Store previous state for history
    const previousItems = order.items;
    const previousBills = order.bills;
    const oldTotal = Number(order.bills.totalWithTax);

    // Calculate new total
    const newTotal = Number(bills.totalWithTax);
    const difference = newTotal - oldTotal;

    // Update order fields
    order.items = items;
    order.bills = {
      total: Number(bills.total),
      tax: Number(bills.tax || 0),
      totalWithTax: Number(bills.totalWithTax)
    };

    // Add to edit history
    if (!order.editHistory) {
      order.editHistory = [];
    }
    order.editHistory.push({
      editedAt: new Date(),
      editedBy: req.user._id,
      previousItems,
      previousBills,
      reason: reason || "Order edited"
    });

    // Regenerate receipt with same order number
    const cafeName = "Vision Café";
    const now = new Date();
    const lines = [
      `${cafeName}`,
      `Order #${order.orderNumber}`,
      `EDITED - ${now.toLocaleString()}`,
      `-----------------------------`
    ];
    
    order.items.forEach((item) => {
      const name = item.name || `Item ${item.id}`;
      const qty = item.quantity || 1;
      const price = item.price || 0;
      lines.push(`${name} x ${qty} - $${price.toFixed(2)}`);
    });
    
    lines.push(`-----------------------------`);
    lines.push(`Subtotal: $${order.bills.total.toFixed(2)}`);
    lines.push(`Tax: $${order.bills.tax.toFixed(2)}`);
    lines.push(`Total: $${order.bills.totalWithTax.toFixed(2)}`);
    lines.push(`Payment: ${order.paymentMethod.toUpperCase()}`);
    lines.push(`-----------------------------`);
    lines.push(`Thank you!`);

    order.receipt = {
      cafeName,
      content: lines.join("\n"),
      createdAt: now
    };

    await order.save();

    // Update session totals if order belongs to a session
    if (order.session) {
      try {
        const updates = { $inc: {} };
        
        if (difference !== 0) {
          updates.$inc.totalSales = difference;
        }

        if (order.paymentMethod && order.paymentMethod.toLowerCase() === 'cash' && difference !== 0) {
          updates.$inc.cashSales = difference;
        } else if (order.paymentMethod && order.paymentMethod.toLowerCase() === 'bankok' && difference !== 0) {
          updates.$inc.bankokSales = difference;
        }

        // Log operation
        const operation = {
          type: 'order_edited',
          details: { 
            orderId: order._id,
            orderNumber: order.orderNumber,
            difference,
            reason: reason || "Order edited"
          },
          createdBy: req.user._id
        };
        updates.$push = { operations: operation };

        await Session.findByIdAndUpdate(order.session, updates);
      } catch (err) {
        console.warn('[editOrder] failed to update session:', err.message || err);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: "Order updated successfully", 
      data: order 
    });
  } catch (error) {
    console.error("[editOrder] error:", error);
    next(error);
  }
};

// Refund order (soft delete)
const refundOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid id!"));
    }

    const order = await Order.findById(id);
    if (!order) {
      return next(createHttpError(404, "Order not found!"));
    }

    // Already refunded
    if (order.status === 'refunded') {
      return next(createHttpError(400, "Order is already refunded"));
    }

    // Permission check
    if (req.user.role !== 'manager' && order.cashier.toString() !== req.user._id.toString()) {
      return next(createHttpError(403, "You can only refund your own orders"));
    }

    const total = Number(order.bills.totalWithTax);

    // Mark as refunded
    order.status = 'refunded';
    order.refundedAt = new Date();
    order.refundedBy = req.user._id;
    order.refundReason = reason || "Customer requested refund";
    await order.save();

    // Update session totals
    if (order.session) {
      try {
        const updates = {
          $inc: { 
            totalOrders: -1,
            totalSales: -total
          }
        };
        
        if (order.paymentMethod && order.paymentMethod.toLowerCase() === 'cash') {
          updates.$inc.totalCashCollected = -total;
        }

        // Log refund operation
        const operation = {
          type: 'order_refunded',
          details: { 
            orderId: order._id,
            orderNumber: order.orderNumber,
            total,
            paymentMethod: order.paymentMethod,
            reason: order.refundReason
          },
          createdBy: req.user._id
        };
        updates.$push = { operations: operation };

        await Session.findByIdAndUpdate(order.session, updates);
      } catch (err) {
        console.warn('[refundOrder] failed to update session:', err.message || err);
      }
    }

    res.status(200).json({ success: true, message: "Order refunded successfully", data: order });
  } catch (error) {
    console.error("[refundOrder] error:", error);
    next(error);
  }
};

module.exports = { 
  addOrder, 
  getOrderById, 
  getOrders, 
  getOrdersBySession,
  getRecentOrdersForCashier,
  searchOrder,
  editOrder,
  refundOrder
};