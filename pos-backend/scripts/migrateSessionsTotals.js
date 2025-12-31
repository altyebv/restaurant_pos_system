/**
 * Migration to recompute session totals from orders and expenses.
 */
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Session = require('../models/sessionModel');
const Order = require('../models/orderModel');

async function run() {
  await connectDB();
  const sessions = await Session.find();
  for (const s of sessions) {
    const orderIds = s.orders || [];
    let agg = { totalSales: 0, totalCashCollected: 0, totalOrders: 0 };
    if (orderIds.length > 0) {
      const results = await Order.aggregate([
        { $match: { _id: { $in: orderIds.map(id => mongoose.Types.ObjectId(id)) } } },
        { $group: { _id: null, totalSales: { $sum: '$bills.totalWithTax' }, totalCashCollected: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$bills.totalWithTax', 0] } }, count: { $sum: 1 } } }
      ]);
      if (results && results[0]) {
        agg.totalSales = results[0].totalSales || 0;
        agg.totalCashCollected = results[0].totalCashCollected || 0;
        agg.totalOrders = results[0].count || 0;
      }
    }

    const expensesSum = (s.expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const endBalance = (Number(s.startingBalance) || 0) + (Number(agg.totalCashCollected) || 0) - (expensesSum || 0);

    s.totalSales = agg.totalSales;
    s.totalCashCollected = agg.totalCashCollected;
    s.totalOrders = agg.totalOrders;
    s.totalExpenses = expensesSum;
    s.endBalance = endBalance;
    await s.save();
    console.log('Updated session', s._id.toString());
  }
  console.log('Done');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(2); });
