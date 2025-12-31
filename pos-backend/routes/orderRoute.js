const express = require("express");
const { 
  addOrder, 
  getOrders, 
  getOrderById, 
  getOrdersBySession,
  getRecentOrdersForCashier,
  searchOrder,
  editOrder,
  refundOrder
} = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Create order (requires auth to attach cashier and session)
router.route("/").post(isVerifiedUser, addOrder);

// Get all orders (authenticated users only)
router.route("/").get(isVerifiedUser, getOrders);

// Get recent orders for current cashier (for history view)
router.route("/recent").get(isVerifiedUser, getRecentOrdersForCashier);

// Search order by order number
router.route("/search").get(isVerifiedUser, searchOrder);

// Get single order by ID
router.route("/:id").get(isVerifiedUser, getOrderById);

// Edit order (update items/bills)
router.route("/:id/edit").put(isVerifiedUser, editOrder);

// Refund order (soft delete)
router.route("/:id/refund").post(isVerifiedUser, refundOrder);

// Fetch orders by session id (manager or session owner only)
router.route("/session/:sessionId").get(isVerifiedUser, getOrdersBySession);

module.exports = router;