import { configureStore } from '@reduxjs/toolkit';
import { cartReducer } from './cartSlice';
import { productsReducer } from './productsSlice';
import { categoryReducer } from './categorySlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    products: productsReducer,
    categories: categoryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
