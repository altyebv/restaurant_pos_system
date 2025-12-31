// Online payment integrations (e.g., Razorpay) have been removed.
// The endpoints that used to handle createOrder / verifyPayment are no longer supported.
// In case any code still calls these handlers, respond with 410 Gone.

const createOrder = async (req, res, next) => {
  res.status(410).json({ success: false, message: "Online payments disabled. Use cash payments." });
};

const verifyPayment = async (req, res, next) => {
  res.status(410).json({ success: false, message: "Online payments disabled. Use cash payments." });
};

const webHookVerification = async (req, res, next) => {
  res.status(410).json({ success: false, message: "Online payments disabled. Webhooks not available." });
};

module.exports = { createOrder, verifyPayment, webHookVerification };
