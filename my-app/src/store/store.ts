import { configureStore } from '@reduxjs/toolkit';
import { categoryReducer } from './categorySlice';
import { cartReducer } from './cartSlice';
import { productsReducer } from './productsSlice';

export const store = configureStore({
  reducer: {
    category: categoryReducer,
    cart: cartReducer,
    products: productsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;