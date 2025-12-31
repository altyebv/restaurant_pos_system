// sessionController.js
const createHttpError = require("http-errors");
const Session = require("../models/sessionModel");
const Order = require("../models/orderModel");
const mongoose = require("mongoose");

// Open a new session for the current authenticated cashier
const openSession = async (req, res, next) => {
  try {
    const cashierId = req.user._id;
    const { startingBalance } = req.body || {};

    // prevent multiple open session by same user
    const existingOpen = await Session.findOne({ cashier: cashierId, status: "open" });
    if (existingOpen) {
      const error = createHttpError(400, "You already have an open session. Close it before opening a new one.");
      return next(error);
    }

    // determine default starting balance from last closed session
    let defaultStart = 0;
    const last = await Session.findOne({ cashier: cashierId, status: "closed" }).sort({ endedAt: -1 });
    if (last && typeof last.endBalance === "number") {
      defaultStart = last.endBalance;
    }

    const session = new Session({
      cashier: cashierId,
      startingBalance: typeof startingBalance === "number" ? startingBalance : defaultStart
    });
    // Add an operation entry to the session to mark it open
    session.operations.push({ type: 'session_open', details: { startingBalance: session.startingBalance }, createdBy: cashierId });
    await session.save();
    res.status(201).json({ success: true, message: "Session opened", data: session });
  } catch (error) {
    next(error);
  }
};

// Get current open session for a user
const getCurrentSession = async (req, res, next) => {
  try {
    const cashierId = req.user._id;
    const session = await Session.findOne({ cashier: cashierId, status: "open" })
      .populate({ path: 'operations.createdBy', select: 'name email' });
    
    if (!session) {
      return res.status(200).json({ success: true, data: null, message: "No open session" });
    }

    // Calculate aggregated totals from orders DIRECTLY (don't rely on session.orders array)
    const agg = await Order.aggregate([
      { 
        $match: { 
          session: session._id,
          cashier: cashierId 
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalSales: { $sum: "$bills.totalWithTax" }, 
          totalCashCollected: { 
            $sum: { 
              $cond: [
                { $eq: ['$paymentMethod', 'cash'] }, 
                '$bills.totalWithTax', 
                0
              ] 
            } 
          }, 
          totalOrders: { $sum: 1 } 
        } 
      }
    ]);

    const computed = agg[0] || { totalSales: 0, totalCashCollected: 0, totalOrders: 0 };

    const payload = session.toObject();
    payload.computedSales = computed.totalSales;
    payload.computedCashCollected = computed.totalCashCollected;
    payload.computedOrders = computed.totalOrders;
    
    // If persisted totals are missing, populate them with computed values for API convenience
    if (!payload.totalSales) payload.totalSales = payload.computedSales;
    if (!payload.totalCashCollected) payload.totalCashCollected = payload.computedCashCollected;
    if (!payload.totalOrders) payload.totalOrders = payload.computedOrders;
    
    res.status(200).json({ success: true, data: payload });
  } catch (error) {
    console.error('[getCurrentSession] error:', error);
    next(error);
  }
};

// Close session: accept optional review fields (expenses, totalCashCollected, comment)
const closeSession = async (req, res, next) => {
  try {
    const cashierId = req.user._id;
    const { sessionId, expenses = [], totalCashCollected, comment } = req.body;

    const query = sessionId ? { _id: sessionId } : { cashier: cashierId, status: 'open' };
    const session = await Session.findOne(query);
    if (!session) {
      const error = createHttpError(404, "Open session not found");
      return next(error);
    }

    if (session.status !== "open") {
      const error = createHttpError(400, "Session is not open");
      return next(error);
    }

    // If session belongs to another user and the current user is not manager, prevent closing
    if (session.cashier.toString() !== cashierId.toString() && req.user.role !== 'manager') {
      return next(createHttpError(403, "You can only close your own sessions"));
    }

    // Compute totalSales and totalCashCollected from orders directly
    const agg = await Order.aggregate([
      { $match: { session: session._id } },
      { 
        $group: { 
          _id: null, 
          totalSales: { $sum: "$bills.totalWithTax" }, 
          totalCashCollected: { 
            $sum: { 
              $cond: [
                { $eq: ['$paymentMethod', 'cash'] }, 
                '$bills.totalWithTax', 
                0
              ] 
            } 
          },
          totalOrders: { $sum: 1 }
        } 
      }
    ]);

    const computed = agg[0] || { totalSales: 0, totalCashCollected: 0, totalOrders: 0 };

    // compute expenses total
    let totalExpenses = 0;
    if (Array.isArray(expenses) && expenses.length > 0) {
      expenses.forEach(e => { totalExpenses += Number(e.amount) || 0; });
      session.expenses = session.expenses.concat(expenses.map(e => ({ ...e, createdBy: cashierId })));
    }

    // Add existing expenses from the session
    if (Array.isArray(session.expenses)) {
      session.expenses.forEach(e => { totalExpenses += Number(e.amount) || 0; });
    }

    // final numbers
    session.totalSales = computed.totalSales;
    session.totalOrders = computed.totalOrders;
    session.totalExpenses = totalExpenses;

    if (typeof totalCashCollected === 'number') {
      session.totalCashCollected = totalCashCollected;
    } else {
      session.totalCashCollected = computed.totalCashCollected;
    }

    session.endBalance = Number(session.startingBalance || 0) + Number(session.totalCashCollected || 0) - Number(session.totalExpenses || 0);
    session.endedAt = new Date();
    session.status = 'closed';
    if (comment) session.comment = comment;
    
    // record a session_closed operation
    session.operations.push({ 
      type: 'session_closed', 
      details: { 
        totalSales: session.totalSales, 
        totalCashCollected: session.totalCashCollected, 
        totalExpenses: session.totalExpenses, 
        endBalance: session.endBalance 
      }, 
      createdBy: cashierId 
    });
    
    await session.save();

    res.status(200).json({ success: true, message: "Session closed", data: session });
  } catch (error) {
    console.error('[closeSession] error:', error);
    next(error);
  }
};

// Add a single expense to an open session
const addExpense = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { amount, description } = req.body;
    const cashierId = req.user._id;

    if (!amount || Number(amount) <= 0) {
      const error = createHttpError(400, "Expense amount must be greater than 0");
      return next(error);
    }

    const session = await Session.findById(sessionId);
    if (!session) return next(createHttpError(404, "Session not found"));
    if (session.status !== 'open') return next(createHttpError(400, "Session is not open"));
    if (session.cashier.toString() !== cashierId.toString() && req.user.role !== 'manager') {
      return next(createHttpError(403, "You can only add expense to your own open session"));
    }

    const expense = { amount: Number(amount), description, createdBy: cashierId };
    session.expenses.push(expense);
    session.totalExpenses += Number(amount);
    // Record the expense in the session operations for auditing on the session
    session.operations.push({ type: 'expense_added', details: { amount: Number(amount), description }, createdBy: cashierId });
    await session.save();

    res.status(201).json({ success: true, message: "Expense recorded", data: expense });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    let sessions;
    // Managers can see all sessions; cashiers should only see their sessions
    if (req.user.role === 'manager') {
      sessions = await Session.find().populate('cashier', 'name email');
    } else {
      sessions = await Session.find({ cashier: req.user._id }).populate('cashier', 'name email');
    }
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(createHttpError(404, "Invalid id"));
    const session = await Session.findById(id).populate('cashier', 'name email').populate('orders')
      .populate({ path: 'operations.createdBy', select: 'name email' });
    if (!session) return next(createHttpError(404, "Session not found"));
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

module.exports = { openSession, getCurrentSession, closeSession, addExpense, getSessions, getSessionById };