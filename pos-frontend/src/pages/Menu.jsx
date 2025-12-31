import React, { useEffect, useState } from "react";
import MenuContainer from "../components/menu/MenuContainer";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import OrderHistory from "../components/menu/OrderHistory";

// Ensure RTL direction
if (typeof window !== "undefined" && typeof document !== "undefined") {
  document.documentElement.setAttribute("dir", "rtl");
}

const Menu = () => {
  // View state: 'cart' or 'history'
  const [currentView, setCurrentView] = useState('cart');
  
  // Order management state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  useEffect(() => {
    document.title = "POS | Cashier";
  }, []);

  // Switch to history view
  const handleShowHistory = () => {
    setCurrentView('history');
    setSelectedOrder(null);
  };

  // Switch back to cart view
  const handleShowCart = () => {
    setCurrentView('cart');
    setSelectedOrder(null);
    
    // If we're not editing, this is just a regular return
    if (!isEditingOrder) {
      setIsEditingOrder(false);
      setEditingOrderId(null);
    }
  };

  // Load order for editing
  const handleLoadOrderToEdit = (order) => {
    setIsEditingOrder(true);
    setEditingOrderId(order._id);
    setSelectedOrder(order);
    setCurrentView('cart'); // Switch back to cart view for editing
  };

  // Cancel editing and clear cart
  const handleCancelEdit = () => {
    setIsEditingOrder(false);
    setEditingOrderId(null);
    setSelectedOrder(null);
  };

  // After successful order submission (create or edit)
  const handleOrderSuccess = () => {
    setIsEditingOrder(false);
    setEditingOrderId(null);
    setSelectedOrder(null);
  };

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex gap-3">
      {/* Menu Items */}
      <div className="flex-[3] px-10 py-4">
        <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider mb-4">
          القائمة
        </h1>
        <MenuContainer />
      </div>

      {/* Right Panel: Cart/History + Bill */}
      <div className="flex-[1] bg-[#1a1a1a] mt-4 mr-3 h-[780px] rounded-lg pt-2 flex flex-col">
        {currentView === 'cart' ? (
          <>
            {/* Cart Info - takes ~380px */}
            <CartInfo 
              onShowHistory={handleShowHistory}
              isEditingOrder={isEditingOrder}
              onCancelEdit={handleCancelEdit}
            />
            
            {/* Divider */}
            <hr className="border-[#2a2a2a] border-t-2" />
            
            {/* Bill Component - takes remaining space */}
            <Bill 
              isEditingOrder={isEditingOrder}
              editingOrderId={editingOrderId}
              editingOrder={selectedOrder}
              onCancelEdit={handleCancelEdit}
              onOrderSuccess={handleOrderSuccess}
            />
          </>
        ) : (
          // Full-height order history view
          <OrderHistory
            onClose={handleShowCart}
            onLoadOrderToEdit={handleLoadOrderToEdit}
            onRefreshAfterAction={handleShowCart}
          />
        )}
      </div>
    </section>
  );
};

export default Menu;