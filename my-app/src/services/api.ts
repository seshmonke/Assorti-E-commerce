import axios from 'axios';
import type { Category } from '../types/categories';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
  category?: Category;
  description: string;
  sizes: string[];
  composition: Record<string, number>;
  discount: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Нормализация JSON-полей продукта (sizes, composition).
 * SQLite + Prisma могут вернуть их как строку вместо объекта.
 */
function normalizeProduct(product: Product): Product {
  const sizes = Array.isArray(product.sizes)
    ? product.sizes
    : typeof product.sizes === 'string'
      ? JSON.parse(product.sizes)
      : [];

  const composition = (
    typeof product.composition === 'object'
    && product.composition !== null
    && !Array.isArray(product.composition)
  )
    ? product.composition as Record<string, number>
    : typeof product.composition === 'string'
      ? JSON.parse(product.composition)
      : {};

  return { ...product, sizes, composition };
}

export async function fetchAllProducts(): Promise<Product[]> {
  const { data } = await api.get<ApiResponse<Product[]>>('/products');
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data.map(normalizeProduct);
}

export async function fetchProductById(id: string): Promise<Product> {
  const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return normalizeProduct(data.data);
}

export async function fetchProductsByCategoryId(categoryId: string): Promise<Product[]> {
  const { data } = await api.get<ApiResponse<Product[]>>(`/products/category/${categoryId}`);
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data.map(normalizeProduct);
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<ApiResponse<Category[]>>('/categories');
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data;
}

export async function fetchSaleProducts(): Promise<Product[]> {
  const { data } = await api.get<ApiResponse<Product[]>>('/products/sale');
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data.map(normalizeProduct);
}
