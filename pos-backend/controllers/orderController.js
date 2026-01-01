const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Session = require("../models/sessionModel");
const { generateOrderNumber, getRecentOrders, searchOrderByNumber } = require("../utils/orderHelpers");

const addOrder = async (req, res, next) => {
  try {
    console.log("[addOrder] incoming payload:", JSON.stringify(req.body));
    console.log("[addOrder] req.user:", req.user ? req.user.id : "NO USER - NOT AUTHENTICATED!");

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
    const { orderNumber, sequenceNumber } = await generateOrderNumber(req.user.id);

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
      cashier: req.user.id
    });
    
    // Attach open session
    if (!orderPayload.session) {
      try {
        const openSessions = Session.findAll({ 
          cashier_id: req.user.id, 
          status: 'active' 
        });
        if (openSessions && openSessions.length > 0) {
          orderPayload.session = openSessions[0].id;
        }
      } catch (err) {
        console.warn('[addOrder] failed to find open session:', err.message || err);
      }
    }

    const saved = Order.create(orderPayload);
    
    // Update session
    if (saved.session) {
      try {
        const session = Session.findById(saved.session);
        if (session) {
          const total = Number(saved.bills && saved.bills.totalWithTax) || 0;
          
          const updates = {
            totalOrders: (session.totalOrders || 0) + 1,
            totalSales: (session.totalSales || 0) + total
          };
          
          if (saved.paymentMethod && saved.paymentMethod.toLowerCase() === 'cash') {
            updates.totalCashCollected = (session.totalCashCollected || 0) + total;
          }
          
          // Add operation to history
          const operations = session.operations || [];
          operations.push({
            type: 'order_created',
            details: {
              orderId: saved.id,
              orderNumber: saved.orderNumber,
              total,
              paymentMethod: saved.paymentMethod
            },
            createdAt: new Date().toISOString(),
            createdBy: saved.cashier
          });
          updates.operations = operations;
          
          Session.update(saved.session, updates);
        }
      } catch (err) {
        console.warn('[addOrder] failed to attach order to session', err.message || err);
      }
    }
    
    console.log("[addOrder] saved order:", saved.orderNumber);
    res.status(201).json({ success: true, message: "Order created!", data: saved });
  } catch (error) {
    console.error("[addOrder] error:", error);
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = Order.findById(Number(id));
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
    const orders = Order.findAll();
    
    // Populate cashier info
    const ordersWithCashier = orders.map(order => {
      return Order.populate(order, ["cashier"]);
    });

    res.status(200).json({ data: ordersWithCashier });
  } catch (error) {
    next(error);
  }
};

const getOrdersBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    if (!sessionId || isNaN(Number(sessionId))) {
      return next(createHttpError(404, "Invalid session id"));
    }

    const session = Session.findById(Number(sessionId));
    if (!session) return next(createHttpError(404, "Session not found"));

    if (req.user.role !== 'manager' && session.cashier_id !== req.user.id) {
      return next(createHttpError(403, "You can only view orders for your own sessions"));
    }

    // Get orders for this session
    const allOrders = Order.findAll({ session_id: Number(sessionId) });
    
    // Calculate summary
    let totalSales = 0;
    let totalCashCollected = 0;
    allOrders.forEach(order => {
      const orderTotal = order.bills.totalWithTax || 0;
      totalSales += orderTotal;
      if (order.paymentMethod === "cash") {
        totalCashCollected += orderTotal;
      }
    });

    // Pagination
    const skip = (Math.max(page, 1) - 1) * limit;
    const paginatedOrders = allOrders.slice(skip, skip + limit);

    res.status(200).json({ 
      success: true, 
      data: { 
        orders: paginatedOrders, 
        totals: { 
          totalOrders: allOrders.length, 
          totalSales, 
          totalCashCollected 
        }, 
        page, 
        limit 
      } 
    });
  } catch (error) {
    next(error);
  }
};

const getRecentOrdersForCashier = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 15, 50);
    const orders = await getRecentOrders(req.user.id, limit);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("[getRecentOrdersForCashier] error:", error);
    next(error);
  }
};

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
    if (req.user.role !== 'manager' && order.cashier !== req.user.id) {
      return next(createHttpError(403, "You can only view your own orders"));
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const editOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, bills, reason } = req.body;

    if (!id || isNaN(Number(id))) {
      return next(createHttpError(404, "Invalid order ID"));
    }

    const order = Order.findById(Number(id));
    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    // Can't edit refunded orders
    if (order.status === 'refunded') {
      return next(createHttpError(400, "Cannot edit a refunded order"));
    }

    // Permission check
    if (req.user.role !== 'manager' && order.cashier !== req.user.id) {
      return next(createHttpError(403, "You can only edit your own orders"));
    }

    // Store previous state for history
    const previousItems = order.items;
    const previousBills = order.bills;
    const oldTotal = Number(order.bills.totalWithTax);

    // Calculate new total
    const newTotal = Number(bills.totalWithTax);
    const difference = newTotal - oldTotal;

    // Add to edit history
    const editHistory = order.editHistory || [];
    editHistory.push({
      editedAt: new Date().toISOString(),
      editedBy: req.user.id,
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
    
    items.forEach((item) => {
      const name = item.name || `Item ${item.id}`;
      const qty = item.quantity || 1;
      const price = item.price || 0;
      lines.push(`${name} x ${qty} - $${price.toFixed(2)}`);
    });
    
    lines.push(`-----------------------------`);
    lines.push(`Subtotal: $${bills.total.toFixed(2)}`);
    lines.push(`Tax: $${bills.tax.toFixed(2)}`);
    lines.push(`Total: $${bills.totalWithTax.toFixed(2)}`);
    lines.push(`Payment: ${order.paymentMethod.toUpperCase()}`);
    lines.push(`-----------------------------`);
    lines.push(`Thank you!`);

    const receipt = {
      cafeName,
      content: lines.join("\n"),
      createdAt: now
    };

    // Update order
    const updated = Order.update(Number(id), {
      items,
      bills: {
        total: Number(bills.total),
        tax: Number(bills.tax || 0),
        totalWithTax: Number(bills.totalWithTax)
      },
      editHistory,
      receipt
    });

    // Update session totals if order belongs to a session
    if (updated.session) {
      try {
        const session = Session.findById(updated.session);
        if (session) {
          const updates = {
            totalSales: (session.totalSales || 0) + difference
          };

          if (updated.paymentMethod && updated.paymentMethod.toLowerCase() === 'cash') {
            updates.totalCashCollected = (session.totalCashCollected || 0) + difference;
          }

          // Log operation
          const operations = session.operations || [];
          operations.push({
            type: 'order_edited',
            details: { 
              orderId: updated.id,
              orderNumber: updated.orderNumber,
              difference,
              reason: reason || "Order edited"
            },
            createdAt: new Date().toISOString(),
            createdBy: req.user.id
          });
          updates.operations = operations;

          Session.update(updated.session, updates);
        }
      } catch (err) {
        console.warn('[editOrder] failed to update session:', err.message || err);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: "Order updated successfully", 
      data: updated 
    });
  } catch (error) {
    console.error("[editOrder] error:", error);
    next(error);
  }
};

const refundOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id || isNaN(Number(id))) {
      return next(createHttpError(404, "Invalid id!"));
    }

    const order = Order.findById(Number(id));
    if (!order) {
      return next(createHttpError(404, "Order not found!"));
    }

    // Already refunded
    if (order.status === 'refunded') {
      return next(createHttpError(400, "Order is already refunded"));
    }

    // Permission check
    if (req.user.role !== 'manager' && order.cashier !== req.user.id) {
      return next(createHttpError(403, "You can only refund your own orders"));
    }

    const total = Number(order.bills.totalWithTax);

    // Mark as refunded
    const refunded = Order.update(Number(id), {
      status: 'refunded',
      refundedAt: new Date().toISOString(),
      refundedBy_id: req.user.id,
      refundReason: reason || "Customer requested refund"
    });

    // Update session totals
    if (refunded.session) {
      try {
        const session = Session.findById(refunded.session);
        if (session) {
          const updates = {
            totalOrders: Math.max((session.totalOrders || 0) - 1, 0),
            totalSales: Math.max((session.totalSales || 0) - total, 0)
          };
          
          if (refunded.paymentMethod && refunded.paymentMethod.toLowerCase() === 'cash') {
            updates.totalCashCollected = Math.max((session.totalCashCollected || 0) - total, 0);
          }

          // Log refund operation
          const operations = session.operations || [];
          operations.push({
            type: 'order_refunded',
            details: { 
              orderId: refunded.id,
              orderNumber: refunded.orderNumber,
              total,
              paymentMethod: refunded.paymentMethod,
              reason: refunded.refundReason
            },
            createdAt: new Date().toISOString(),
            createdBy: req.user.id
          });
          updates.operations = operations;

          Session.update(refunded.session, updates);
        }
      } catch (err) {
        console.warn('[refundOrder] failed to update session:', err.message || err);
      }
    }

    res.status(200).json({ success: true, message: "Order refunded successfully", data: refunded });
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