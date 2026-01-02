import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice, removeAllItems } from "../../redux/slices/cartSlice";
import { enqueueSnackbar } from "notistack";
import { addOrder, editOrder } from "../../https/index";
import Invoice from "../invoice/Invoice";
import QR from '../../assets/images/qr.png';
import { MdEdit } from "react-icons/md";

const Bill = ({ 
  isEditingOrder, 
  editingOrderId, 
  editingOrder,
  onCancelEdit, 
  onOrderSuccess 
}) => {
  const dispatch = useDispatch();
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  
  const tax = 0;
  const totalPriceWithTax = total + tax;

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      enqueueSnackbar("اختر طريقة الدفع!", { variant: "warning" });
      return;
    }

    if (!cartData || cartData.length === 0) {
      enqueueSnackbar("السلة فارغة!", { variant: "warning" });
      return;
    }

    setIsProcessing(true);
    const payload = {
      bills: { 
        total: Number(total.toFixed(2)), 
        tax: Number(tax.toFixed(2)), 
        totalWithTax: Number(totalPriceWithTax.toFixed(2)) 
      },
      items: cartData.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        pricePerQuantity: item.pricePerQuantity
      })),
      paymentMethod
    };

    try {
      let saved;
      
      if (isEditingOrder && editingOrderId) {
        const editPayload = {
          items: payload.items,
          bills: payload.bills,
          reason: "تم تعديل الطلب من قبل الكاشير"
        };
        
        const res = await editOrder({ 
          orderId: editingOrderId,
          ...editPayload 
        });
        saved = res.data.data;
        enqueueSnackbar("تم تعديل الطلب بنجاح!", { variant: "success" });
      } else {
        const res = await addOrder(payload);
        saved = res.data.data;
        enqueueSnackbar("تم حفظ الطلب!", { variant: "success" });
      }
      
      setOrderInfo(saved);
      setAutoPrint(true);
      setShowInvoice(true);
      
      dispatch(removeAllItems());
      setPaymentMethod(null);
      setShowQR(false);
      
      if (onOrderSuccess) {
        onOrderSuccess();
      }
    } catch (err) {
      console.error("Failed to save order:", err);
      enqueueSnackbar(
        err?.response?.data?.message || "فشل حفظ الطلب", 
        { variant: "error" }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="px-5 py-2">
        {/* Bill Summary - Compact */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#ababab] font-medium">عناصر</p>
            <h1 className="text-[#f5f5f5] text-md font-bold">
              {total.toFixed(2)}
            </h1>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#ababab] font-medium">رسوم إضافية</p>
            <h1 className="text-[#f5f5f5] text-md font-bold">
              {tax.toFixed(2)}
            </h1>
          </div>
          
          <div className="flex items-center justify-between pb-2 border-b border-[#2a2a2a]">
            <p className="text-xs text-[#ababab] font-medium">الإجمالي</p>
            <h1 className="text-[#f5f5f5] text-md font-bold">
              {totalPriceWithTax.toFixed(2)}
            </h1>
          </div>
        </div>

        {/* Editing Indicator - Compact */}
        {isEditingOrder && (
          <div className="mt-2">
            <div className="bg-yellow-900/30 border border-yellow-600 rounded p-2 text-center">
              <div className="text-yellow-400 text-xs flex items-center justify-center gap-1">
                <MdEdit size={14} />
                <span>تعديل {editingOrder?.orderNumber}</span>
              </div>
              <button
                onClick={onCancelEdit}
                className="text-red-400 hover:text-red-300 text-xs mt-1 underline"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Payment Method Selection - Compact */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`px-3 py-2 w-full rounded-lg font-semibold text-sm transition-colors ${
                paymentMethod === "cash" 
                  ? "bg-[#383737] text-white" 
                  : "bg-[#1f1f1f] text-[#ababab]"
              }`}
            >
              نقداً
            </button>
            
            <button
              onClick={() => {
                setPaymentMethod("bankak");
                setShowQR(true);
              }}
              className={`px-3 py-2 w-full rounded-lg font-semibold text-sm transition-colors ${
                paymentMethod === "bankak" 
                  ? "bg-[#383737] text-white" 
                  : "bg-[#1f1f1f] text-[#ababab]"
              }`}
            >
              bankak
            </button>
          </div>
        </div>

        {/* Submit Button - Compact */}
        <div className="mt-3">
          <button
            onClick={handlePlaceOrder}
            disabled={!paymentMethod || cartData.length === 0 || isProcessing}
            className={`w-full py-2.5 rounded-lg text-[#f5f5f5] font-semibold text-base transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              !paymentMethod || cartData.length === 0 || isProcessing
                ? 'bg-gray-600'
                : 'bg-[#025cca] hover:bg-[#0246a0]'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                جاري المعالجة...
              </>
            ) : isEditingOrder ? (
              <>
                <MdEdit size={18} />
                حفظ التعديلات
              </>
            ) : (
              "تابع"
            )}
          </button>
        </div>
      </div>

      {/* Bankak QR Code Modal */}
      {showQR && paymentMethod === "bankak" && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <button
              onClick={() => setShowQR(false)}
              className="self-end text-sm text-gray-600 hover:text-gray-800 mb-2"
            >
              ✕ Close
            </button>
            <p className="text-sm text-[#2d2d2d] mb-3 font-semibold">
              إنسخ الرمز للدفع
            </p>
            <img
              alt="Bankak Payment QR Code"
              src={QR}
              className="w-64 h-64"
            />
            <p className="text-xs text-gray-500 mt-3">
              Amount: {totalPriceWithTax.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && orderInfo && (
        <Invoice
          orderInfo={orderInfo}
          setShowInvoice={setShowInvoice}
          autoPrint={autoPrint}
          onPrinted={() => {
            setAutoPrint(false);
            setShowInvoice(false);
          }}
        />
      )}
    </>
  );
};

export default Bill;