const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

const operationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  details: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

const sessionSchema = new mongoose.Schema({
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  startingBalance: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  totalCashCollected: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  expenses: { type: [expenseSchema], default: [] },
  // store operations that happened during the session (orders, expenses, table ops, etc.)
  operations: { type: [operationSchema], default: [] },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  totalOrders: { type: Number, default: 0 },
  endBalance: { type: Number, default: 0 },
  comment: { type: String },
  // operations field stores structured operationSchema entries
  // (do not duplicate this field elsewhere)
  status: { type: String, enum: ["open","closed","reviewed"], default: "open" }
}, { timestamps: true });

// Indexes to optimize common lookups
sessionSchema.index({ cashier: 1, status: 1 });
sessionSchema.index({ startedAt: -1 });
sessionSchema.index({ endedAt: -1 });

module.exports = mongoose.model("Session", sessionSchema);
