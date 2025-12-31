import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addOrUpdateItem: (state, action) => {
            const newItem = action.payload;
            const existing = state.find(item => item.id === newItem.id);

            if (existing) {
                existing.quantity += newItem.quantity;
                existing.price = existing.quantity * existing.pricePerQuantity;
            } else {
                state.push(newItem);
            }
        },

        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload;
            const item = state.find(i => i.id === id);
            if (item) {
                item.quantity = quantity;
                item.price = quantity * item.pricePerQuantity;
            }
        },

        removeItem: (state, action) =>
            state.filter((item) => item.id !== action.payload),

        removeAllItems: () => [],

        // New action: set entire cart (for loading orders to edit)
        setCart: (state, action) => {
            return action.payload;
        }
    },
});

export const getTotalPrice = (state) =>
    state.cart.reduce((total, item) => total + item.price, 0);

export const {
    addOrUpdateItem,
    updateQuantity,
    removeItem,
    removeAllItems,
    setCart
} = cartSlice.actions;

export default cartSlice.reducer;