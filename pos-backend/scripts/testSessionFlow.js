/**
 * Script to simulate a login/session/order/close flow using models directly.
 * Run with: node scripts/testSessionFlow.js
 */
const connectDB = require('../config/database');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Session = require('../models/sessionModel');
const Order = require('../models/orderModel');

async function run() {
  await connectDB();
  const user = await User.findOne({ email: 'demo@vision.cafe' }) || await User.findOne();
  if (!user) return console.error('no user found');

  // create or reuse open session
  let session = await Session.findOne({ cashier: user._id, status: 'open' });
  if (!session) {
    session = new Session({ cashier: user._id, startingBalance: 100 });
    await session.save();
    console.log('created session', session._id.toString());
  }

  const order1 = new Order({ orderStatus: 'In Progress', bills: { total: 10, tax: 1, totalWithTax: 11 }, items: [{ name: 'Coffee', quantity: 1, price: 10 }], paymentMethod: 'cash', cashier: user._id, session: session._id });
  const saved1 = await order1.save();
  await Session.findByIdAndUpdate(session._id, { $push: { orders: saved1._id }, $inc: { totalSales: 11, totalCashCollected: 11, totalOrders: 1 } });

  const order2 = new Order({ orderStatus: 'In Progress', bills: { total: 5, tax: 0.5, totalWithTax: 5.5 }, items: [{ name: 'Tea', quantity: 1, price: 5 }], paymentMethod: 'cash', cashier: user._id, session: session._id });
  const saved2 = await order2.save();
  await Session.findByIdAndUpdate(session._id, { $push: { orders: saved2._id }, $inc: { totalSales: 5.5, totalCashCollected: 5.5, totalOrders: 1 } });

  // re-fetch session and close
  session = await Session.findById(session._id);
  console.log('session before close totals', { totalSales: session.totalSales, totalCashCollected: session.totalCashCollected, totalOrders: session.totalOrders });

  // emulate close
  const orderIds = (session.orders || []);
  const agg = await Order.aggregate([
    { $match: { _id: { $in: orderIds.map(id => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: null, totalSales: { $sum: '$bills.totalWithTax' }, totalCashCollected: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$bills.totalWithTax', 0] } }, count: { $sum: 1 } } }
  ]);
  const computed = agg && agg[0] ? agg[0] : { totalSales: 0, totalCashCollected: 0, count: 0 };
  session.totalSales = computed.totalSales;
  session.totalCashCollected = computed.totalCashCollected;
  const expensesSum = (session.expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  session.totalExpenses = expensesSum;
  session.endBalance = Number(session.startingBalance || 0) + Number(session.totalCashCollected || 0) - Number(session.totalExpenses || 0);
  session.endedAt = new Date();
  session.status = 'closed';
  await session.save();
  console.log('session after close totals', { totalSales: session.totalSales, totalCashCollected: session.totalCashCollected, totalOrders: session.totalOrders, totalExpenses: session.totalExpenses, endBalance: session.endBalance });
  
  // fetch orders by session and print them
  const orders = await Order.find({ session: session._id }).sort({ createdAt: -1 });
  console.log('orders for session:', orders.map(o => ({ id: o._id.toString(), total: o.bills && o.bills.totalWithTax, paymentMethod: o.paymentMethod })));
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(2); });
