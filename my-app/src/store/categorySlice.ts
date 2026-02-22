import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCategories } from '../services/api';
import type { Category } from '../types/categories';

interface CategoryState {
  items: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  items: [],
  loading: false,
  error: null,
};

export const loadCategories = createAsyncThunk(
  'categories/loadAll',
  async () => fetchCategories(),
);

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Ошибка загрузки категорий';
      });
  },
});

export const categoryReducer = categorySlice.reducer;
