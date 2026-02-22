import type { ProductCategory } from '../types/categories';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: ProductCategory;
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

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status} ${res.statusText}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (!json.success || json.data === undefined) {
    throw new Error(json.error ?? 'Unknown API error');
  }
  return json.data;
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
  const res = await fetch(`${API_URL}/api/products`);
  const products = await handleResponse<Product[]>(res);
  return products.map(normalizeProduct);
}

export async function fetchProductById(id: number): Promise<Product> {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  const product = await handleResponse<Product>(res);
  return normalizeProduct(product);
}

export async function fetchProductsByCategory(category: ProductCategory): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/products/category/${category}`);
  const products = await handleResponse<Product[]>(res);
  return products.map(normalizeProduct);
}

export async function fetchSaleProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/products/sale`);
  const products = await handleResponse<Product[]>(res);
  return products.map(normalizeProduct);
}
