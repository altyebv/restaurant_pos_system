import React, { useState, useEffect } from "react";
import { MdEdit, MdRefresh } from "react-icons/md";
import { getRecentOrders, searchOrderByNumber, refundOrder } from "../../https";
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { removeAllItems, setCart } from "../../redux/slices/cartSlice";
import Modal from "../shared/Modal";

const OrderHistory = ({ onClose, onLoadOrderToEdit, onRefreshAfterAction }) => {
  const dispatch = useDispatch();
  
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Refund modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  // Load recent orders on mount
  useEffect(() => {
    loadRecentOrders();
  }, []);

  const loadRecentOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await getRecentOrders(15);
      setOrders(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
      enqueueSnackbar("فشل تحميل الطلبات", { variant: "error" });
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      enqueueSnackbar("أدخل رقم الطلب", { variant: "warning" });
      return;
    }

    setIsLoadingOrders(true);
    try {
      const res = await searchOrderByNumber(searchQuery.trim());
      setOrders([res?.data?.data]);
    } catch (err) {
      console.error("Order not found:", err);
      enqueueSnackbar("الطلب غير موجود", { variant: "error" });
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(selectedOrder?._id === order._id ? null : order);
  };

  const handleEditOrder = (order) => {
    if (order.status === 'refunded') {
      enqueueSnackbar("لا يمكن تعديل طلب مسترجع", { variant: "warning" });
      return;
    }

    // Clear current cart
    dispatch(removeAllItems());
    
    // Load order items into cart
    const cartItems = order.items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      pricePerQuantity: item.pricePerQuantity || item.price / item.quantity
    }));
    
    dispatch(setCart(cartItems));
    
    enqueueSnackbar(`جاري تعديل الطلب ${order.orderNumber}`, { variant: "info" });
    
    // Notify parent to switch to cart view with editing state
    if (onLoadOrderToEdit) {
      onLoadOrderToEdit(order);
    }
  };

  const handleOpenRefund = (order) => {
    if (order.status === 'refunded') {
      enqueueSnackbar("هذا الطلب مسترجع بالفعل", { variant: "warning" });
      return;
    }
    setSelectedOrder(order);
    setRefundReason("");
    setShowRefundModal(true);
  };

  const handleSubmitRefund = async () => {
    if (!selectedOrder) return;

    try {
      await refundOrder({ 
        orderId: selectedOrder._id, 
        reason: refundReason || "استرجاع من الزبون" 
      });
      enqueueSnackbar("تم استرجاع الطلب بنجاح", { variant: "success" });
      setShowRefundModal(false);
      setSelectedOrder(null);
      loadRecentOrders();
      
      // Optionally notify parent to refresh
      if (onRefreshAfterAction) {
        setTimeout(() => onRefreshAfterAction(), 500);
      }
    } catch (err) {
      console.error("Failed to refund order:", err);
      enqueueSnackbar("فشل استرجاع الطلب", { variant: "error" });
    }
  };

  return (
    <>
      <div className="px-4 py-2 h-full flex flex-col" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg text-[#e4e4e4] font-semibold tracking-wide">
            سجل الطلبات
          </h1>
          <button
            className="text-[#ababab] hover:text-white p-1 rounded transition-colors"
            onClick={onClose}
            title="رجوع"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="ابحث برقم الطلب (A1-001)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-[#2b2b2b] text-white px-3 py-2 rounded text-sm outline-none"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded transition-colors"
            title="بحث"
          >
            🔍
          </button>
          <button
            onClick={loadRecentOrders}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 rounded transition-colors"
            title="تحديث"
          >
            <MdRefresh size={18} />
          </button>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {isLoadingOrders ? (
            <p className="text-[#ababab] text-sm flex justify-center items-center h-full">
              جاري التحميل...
            </p>
          ) : orders.length === 0 ? (
            <p className="text-[#ababab] text-sm flex justify-center items-center h-full text-center">
              لا توجد طلبات
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className={`rounded-lg px-4 py-3 mb-2 transition-all ${
                  order.status === 'refunded' 
                    ? 'bg-red-900/20 border border-red-700' 
                    : selectedOrder?._id === order._id
                    ? 'bg-blue-900/30 border border-blue-600'
                    : 'bg-[#1f1f1f] hover:bg-[#2a2a2a]'
                }`}
              >
                {/* Order Header */}
                <div 
                  className="cursor-pointer"
                  onClick={() => handleSelectOrder(order)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#f5f5f5] font-bold text-sm">
                        {order.orderNumber}
                      </span>
                      {order.status === 'refunded' && (
                        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">
                          مسترجع
                        </span>
                      )}
                      {order.editHistory && order.editHistory.length > 0 && (
                        <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
                          معدل
                        </span>
                      )}
                    </div>
                    <span className="text-[#ababab] text-xs">
                      {new Date(order.createdAt).toLocaleString("ar-EG", {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="text-[#ababab] text-xs mb-2 max-h-16 overflow-y-auto">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.name} x{item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-gray-500">+{order.items.length - 3} المزيد</div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="text-[#f5f5f5] font-bold">
                      {order.bills.totalWithTax.toFixed(2)}
                    </span>
                    <span className="text-[#ababab] text-xs">
                      {order.paymentMethod === 'cash' ? 'نقداً' : 'bankak'}
                    </span>
                  </div>
                </div>

                {/* Expanded Details with Actions */}
                {selectedOrder?._id === order._id && (
                  <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                    <button
                      onClick={() => handleEditOrder(order)}
                      disabled={order.status === 'refunded'}
                      className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                        order.status === 'refunded'
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <MdEdit size={16} />
                      تعديل الطلب
                    </button>

                    <button
                      onClick={() => handleOpenRefund(order)}
                      disabled={order.status === 'refunded'}
                      className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                        order.status === 'refunded'
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      استرجاع الطلب
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Refund Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        title={`استرجاع الطلب ${selectedOrder?.orderNumber || ''}`}
      >
        <div className="space-y-3">
          <div className="bg-[#2b2b2b] p-3 rounded">
            <div className="text-sm text-gray-400 mb-2">المبلغ:</div>
            <div className="text-lg text-white font-bold">
              {selectedOrder?.bills.totalWithTax.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              السبب (اختياري):
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="مثال: طلب من الزبون، خطأ في الطلب..."
              className="w-full bg-[#2b2b2b] text-white p-2 rounded text-sm outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
              onClick={() => setShowRefundModal(false)}
            >
              إلغاء
            </button>
            <button
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              onClick={handleSubmitRefund}
            >
              تأكيد الاسترجاع
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default OrderHistory;