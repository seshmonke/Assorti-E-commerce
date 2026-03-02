import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../services/api';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  images: string[];
  quantity: number;
  size: string;
  discount?: number; // Процент скидки
}

interface CartState {
  items: CartItem[];
  totalPrice: number;
  totalDiscount: number; // Общая сумма скидки
}

const STORAGE_KEY = 'assortiShop_cart';

const initialState: CartState = {
  items: [],
  totalPrice: 0,
  totalDiscount: 0
};

const calculateTotalPrice = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    const finalPrice = item.discount
      ? Math.round(item.price * (1 - item.discount / 100))
      : item.price;
    return total + finalPrice * item.quantity;
  }, 0);
};

const saveToLocalStorage = (items: CartItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ product: Product; size: string }>) => {
      const { product, size } = action.payload;
      const existingItem = state.items.find(item => item.id === product.id && item.size === size);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          images: product.images,
          quantity: 1,
          size: size,
          discount: product.discount ?? undefined,
        });
      }

      state.totalPrice = calculateTotalPrice(state.items);
      saveToLocalStorage(state.items);
    },

    removeFromCart: (state, action: PayloadAction<{ id: string; size: string }>) => {
      state.items = state.items.filter(item => !(item.id === action.payload.id && item.size === action.payload.size));
      state.totalPrice = calculateTotalPrice(state.items);
      saveToLocalStorage(state.items);
    },

    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number; size: string }>) => {
      const item = state.items.find(item => item.id === action.payload.id && item.size === action.payload.size);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(item => !(item.id === action.payload.id && item.size === action.payload.size));
        } else {
          item.quantity = action.payload.quantity;
        }
        state.totalPrice = calculateTotalPrice(state.items);
        saveToLocalStorage(state.items);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
      saveToLocalStorage([]);
    },

    loadFromLocalStorage: (state) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          state.items = JSON.parse(saved);
          state.totalPrice = calculateTotalPrice(state.items);
        } catch (error) {
          console.error('Failed to load cart from localStorage:', error);
        }
      }
    }
  }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, loadFromLocalStorage } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
