import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchAllProducts,
  fetchProductById,
  fetchProductsByCategoryId,
  fetchSaleProducts,
  type Product,
} from '../services/api';

interface ProductsState {
  items: Product[];
  currentProduct: Product | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  currentProduct: null,
  loading: false,
  error: null,
};

export const loadAllProducts = createAsyncThunk(
  'products/loadAll',
  async () => fetchAllProducts(),
);

export const loadProductsByCategoryId = createAsyncThunk(
  'products/loadByCategoryId',
  async (categoryId: string) => fetchProductsByCategoryId(categoryId),
);

export const loadSaleProducts = createAsyncThunk(
  'products/loadSale',
  async () => fetchSaleProducts(),
);

export const loadProductById = createAsyncThunk(
  'products/loadById',
  async (id: string) => fetchProductById(id),
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    // loadAllProducts
    builder
      .addCase(loadAllProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Ошибка загрузки товаров';
      });

    // loadProductsByCategoryId
    builder
      .addCase(loadProductsByCategoryId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadProductsByCategoryId.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadProductsByCategoryId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Ошибка загрузки категории';
      });

    // loadSaleProducts
    builder
      .addCase(loadSaleProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSaleProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadSaleProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Ошибка загрузки товаров со скидкой';
      });

    // loadProductById
    builder
      .addCase(loadProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentProduct = null;
      })
      .addCase(loadProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(loadProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Ошибка загрузки товара';
      });
  },
});

export const { clearCurrentProduct } = productsSlice.actions;
export const productsReducer = productsSlice.reducer;
