import React, { useState } from "react";
import { menus } from "../../constants";
import { GrRadialSelected } from "react-icons/gr";
import { useDispatch, useSelector } from "react-redux";
import { addOrUpdateItem } from "../../redux/slices/cartSlice";


const MenuContainer = () => {
  const [selected, setSelected] = useState(menus[0]);
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  const handleAddToCart = (item) => {
    const { id, name, price } = item;
    const newObj = { id: id, name, pricePerQuantity: price, quantity: 1, price: price };
    dispatch(addOrUpdateItem(newObj));
  };


  return (
    <>
      <div className="grid grid-cols-4 gap-4 px-10 py-4 w-[100%]">
        {menus.map((menu) => {
          return (
            <div
              key={menu.id}
              className="flex flex-col items-start justify-between p-4 rounded-lg h-[100px] cursor-pointer"
              style={{ backgroundColor: menu.bgColor }}
              onClick={() => {
                setSelected(menu);
              }}
            >
              <div className="flex items-center justify-between w-full">
                <h1 className="text-[#f5f5f5] text-lg font-semibold">
                  {menu.icon} {menu.name}
                </h1>
                {selected.id === menu.id && (
                  <GrRadialSelected className="text-white" size={20} />
                )}
              </div>
              <p className="text-[#ababab] text-sm font-semibold">
                {menu.items.length} Items
              </p>
            </div>
          );
        })}
      </div>

      <hr className="border-[#2a2a2a] border-t-2 mt-4" />

      <div className="grid grid-cols-4 gap-4 px-10 py-4 w-[100%]">
        {selected?.items.map((item) => {
          const cartItem = cart.find((c) => c.id === item.id);
          const qty = cartItem ? cartItem.quantity : 0;
            return (
            <div
              key={item.id}
              className="relative flex flex-col justify-between p-4 rounded-xl h-[150px] cursor-pointer bg-[#121212] hover:shadow-xl transform hover:-translate-y-1 transition-all"
              onClick={() => handleAddToCart(item)}
            >
              {qty > 0 && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                x{qty}
              </div>
              )}

              <div className="mb-2">
              <h1 className="text-[#f5f5f5] text-lg font-semibold">{item.name}</h1>
              {/* <p className="text-[#9a9a9a] text-sm mt-1">{item.category || ""}</p> */}
              </div>

              <div className="flex items-center justify-between w-full">
              <p className="text-[#f5f5f5] text-2xl font-bold">{`${item.price}`}</p>
              {/* <div className="bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-lg pointer-events-none"> */}
                {/* Add */}
              {/* </div> */}
              </div>
            </div>
            );
        })}
      </div>
    </>
  );
};

export default MenuContainer;
