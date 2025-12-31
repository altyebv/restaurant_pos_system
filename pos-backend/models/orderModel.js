const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        // Format: A1-042
    },
    items: { 
        type: Array, 
        required: true,
        default: [] 
    },
    bills: {
        total: { type: Number, required: true },
        tax: { type: Number, required: true },
        totalWithTax: { type: Number, required: true }
    },
    paymentMethod: { 
        type: String, 
        required: true 
    },
    cashier: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true 
    },
    session: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Session"
    },
    status: {
        type: String,
        enum: ["completed", "refunded", "voided"],
        default: "completed"
    },
    // Refund information
    refundedAt: { type: Date },
    refundReason: { type: String },
    refundedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User"
    },
    // If this order was edited, track the new order
    replacedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    // If this order replaces another, track original
    replacedOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    // Edit history to track changes
    editHistory: [{
        editedAt: { type: Date },
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        previousItems: { type: Array },
        previousBills: { type: Object },
        reason: { type: String }
    }],
    receipt: {
        cafeName: String,
        content: String,
        createdAt: Date
    }
}, { timestamps: true });

// Indexes for efficient queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ session: 1 });
orderSchema.index({ cashier: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model("Order", orderSchema);