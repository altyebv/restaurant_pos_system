const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    paymentId: String,
    orderId: String,
    amount: Number,
    currency: String,
    status: String,
    method: String,
    email: String,
    contact: String,
    createdAt: Date
})

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;