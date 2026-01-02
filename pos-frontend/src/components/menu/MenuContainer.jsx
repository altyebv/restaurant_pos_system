import React, { useState, useEffect } from "react";
import { GrRadialSelected } from "react-icons/gr";
import { useDispatch, useSelector } from "react-redux";
import { addOrUpdateItem } from "../../redux/slices/cartSlice";
import { getMenus } from "../../https";
import { enqueueSnackbar } from "notistack";

const MenuContainer = () => {
  const [menus, setMenus] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    setIsLoading(true);
    try {
      console.log("📡 Loading menus from API...");
      const res = await getMenus();
      const menuData = res?.data?.data || [];
      setMenus(menuData);
      if (menuData.length > 0) {
        setSelected(menuData[0]);
      }
    } catch (err) {
      console.error("❌ Failed to load menus:", err);
      enqueueSnackbar("فشل تحميل القائمة", { variant: "error" });
      setMenus([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    const { id, name, price } = item;
    const newObj = { 
      id: id, 
      name, 
      pricePerQuantity: price, 
      quantity: 1, 
      price: price 
    };
    dispatch(addOrUpdateItem(newObj));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="text-6xl mb-4">🍽️</div>
        <p className="text-gray-400 text-xl mb-2">لا توجد قوائم متاحة</p>
        <p className="text-gray-500 text-sm">أضف فئات وعناصر من لوحة التحكم</p>
      </div>
    );
  }

  return (
    <>
      {/* Categories Grid */}
      <div className="grid grid-cols-4 gap-4 px-10 py-4 w-[100%]">
        {menus.map((menu) => {
          const itemCount = menu.items?.length || 0;
          return (
            <div
              key={menu.id}
              className={`flex flex-col items-start justify-between p-4 rounded-xl h-[100px] cursor-pointer transition-all transform hover:scale-105 hover:shadow-xl ${
                selected?.id === menu.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : ''
              }`}
              style={{ 
                backgroundColor: menu.bgColor || '#1a1a1a',
                backgroundImage: menu.bgColor ? `linear-gradient(135deg, ${menu.bgColor} 0%, ${menu.bgColor}dd 100%)` : 'none'
              }}
              onClick={() => setSelected(menu)}
            >
              <div className="flex items-center justify-between w-full">
                <h1 className="text-white text-lg font-bold drop-shadow-lg">
                  {menu.icon && <span className="mr-2">{menu.icon}</span>}
                  {menu.name}
                </h1>
                {selected?.id === menu.id && (
                  <GrRadialSelected className="text-white drop-shadow-lg" size={22} />
                )}
              </div>
              <p className="text-white/80 text-sm font-semibold drop-shadow">
                {itemCount} {itemCount === 1 ? 'عنصر' : 'عناصر'}
              </p>
            </div>
          );
        })}
      </div>

      <hr className="border-[#2a2a2a] border-t-2 mt-4" />

      {/* Items Grid */}
      <div className="grid grid-cols-4 gap-4 px-10 py-4 w-[100%]">
        {selected?.items && selected.items.length > 0 ? (
          selected.items.map((item) => {
            const cartItem = cart.find((c) => c.id === item.id);
            const qty = cartItem ? cartItem.quantity : 0;
            
            return (
              <div
                key={item.id}
                className="relative flex flex-col justify-between p-4 rounded-xl h-[140px] cursor-pointer bg-[#1a1a1a] hover:bg-[#222] border border-gray-800 hover:border-gray-600 hover:shadow-lg transform hover:-translate-y-1 transition-all"
                onClick={() => handleAddToCart(item)}
              >
                {qty > 0 && (
                  <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    x{qty}
                  </div>
                )}

                <div className="mb-2 flex-1">
                  <h1 className="text-white text-base font-semibold leading-tight">{item.name}</h1>
                  {item.category && (
                    <p className="text-gray-500 text-xs mt-1">{item.category}</p>
                  )}
                </div>

                <div className="flex items-center justify-between w-full">
                  <p className="text-white text-xl font-bold">
                    {item.price.toFixed(2)}
                  </p>
                  <div className="bg-[#025cca] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                    +
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-4 flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">🍴</div>
            <p className="text-gray-400 text-lg">لا توجد عناصر في هذه الفئة</p>
          </div>
        )}
      </div>
    </>
  );
};

export default MenuContainer;