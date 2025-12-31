import React, { useEffect, useRef } from "react";
import { RiDeleteBin2Fill, RiHistoryLine } from "react-icons/ri";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { removeItem, updateQuantity, removeAllItems } from "../../redux/slices/cartSlice";
import Modal from "../shared/Modal";
import { useState } from "react";

const CartInfo = ({ onShowHistory, isEditingOrder, onCancelEdit }) => {
  const dispatch = useDispatch();
  const cartData = useSelector((state) => state.cart);
  const scrollRef = useRef();
  
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  // Auto-scroll cart when items are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [cartData]);

  // Cart actions
  const handleRemoveItem = (id) => dispatch(removeItem(id));
  
  const handleIncrease = (id, qty) =>
    dispatch(updateQuantity({ id, quantity: qty + 1 }));
  
  const handleDecrease = (id, qty) => {
    const newQty = qty - 1;
    if (newQty <= 0) dispatch(removeItem(id));
    else dispatch(updateQuantity({ id, quantity: newQty }));
  };

  const handleClearCart = () => {
    dispatch(removeAllItems());
    setShowClearCartModal(false);
    if (isEditingOrder && onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <>
      <div className="px-4 py-2 h-[380px] flex flex-col" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg text-[#e4e4e4] font-semibold tracking-wide">
            {isEditingOrder ? "تعديل الطلب" : "معلومات الطلب"}
          </h1>

          <div className="flex gap-2">
            {isEditingOrder && (
              <button
                title="إلغاء التعديل"
                className="text-red-500 hover:text-red-400 px-2 py-1 rounded transition-colors text-xs"
                onClick={onCancelEdit}
              >
                ✕ إلغاء
              </button>
            )}
            
            <button
              title="سجل الطلبات"
              className="text-[#ababab] hover:text-white p-1 rounded transition-colors"
              onClick={onShowHistory}
            >
              <RiHistoryLine size={18} />
            </button>

            <button
              title="حذف الطلب"
              className="text-[#ababab] hover:text-white p-1 rounded transition-colors"
              onClick={() => cartData.length && setShowClearCartModal(true)}
            >
              <RiDeleteBin2Fill size={18} />
            </button>
          </div>
        </div>

        {/* Cart Items - Scrollable */}
        <div
          ref={scrollRef}
          className="mt-4 overflow-y-auto scrollbar-hide flex-1"
        >
          {cartData.length === 0 ? (
            <p className="text-[#ababab] text-sm flex justify-center font-bold items-center h-full text-center">
              لا توجد طلبات
              <br />
              أضف من القائمة
            </p>
          ) : (
            cartData.map((item) => (
              <div
                key={item.id}
                className="bg-[#1f1f1f] rounded-lg px-4 py-4 mb-2"
              >
                <div className="flex items-center justify-between flex-row-reverse">
                  <h1 className="text-[#ababab] font-semibold tracking-wide text-md">
                    {item.name}
                  </h1>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrease(item.id, item.quantity)}
                      className="p-1 bg-[#2b2b2b] rounded text-[#ababab] hover:text-white"
                    >
                      <AiOutlineMinus size={14} />
                    </button>

                    <span className="text-[#ababab] font-semibold">
                      x{item.quantity}
                    </span>

                    <button
                      onClick={() => handleIncrease(item.id, item.quantity)}
                      className="p-1 bg-[#2b2b2b] rounded text-[#ababab] hover:text-white"
                    >
                      <AiOutlinePlus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 flex-row-reverse">
                  <p className="text-[#f5f5f5] text-md font-bold">
                    {item.price.toFixed(2)}
                  </p>

                  <RiDeleteBin2Fill
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-[#ababab] cursor-pointer hover:text-red-500 transition-colors"
                    size={20}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clear Cart Modal */}
      <Modal
        isOpen={showClearCartModal}
        onClose={() => setShowClearCartModal(false)}
        title="حذف الطلب ؟"
      >
        <p className="text-xl text-center text-gray-400 mb-4">
          هل أنت متأكد
        </p>
        <div className="flex justify-center gap-3">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={() => setShowClearCartModal(false)}
          >
            إلغاء
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            onClick={handleClearCart}
          >
            حذف
          </button>
        </div>
      </Modal>
    </>
  );
};

export default CartInfo;