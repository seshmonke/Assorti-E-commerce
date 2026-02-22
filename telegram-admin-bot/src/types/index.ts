// Типы для товаров (соответствуют бэкенду)
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
  category?: Category;
  description: string;
  sizes: unknown;
  composition: unknown;
  discount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  price: number;
  image: string;
  categoryId: string;
  description: string;
  sizes: unknown;
  composition: unknown;
  discount?: number;
}

export interface UpdateProductData {
  name?: string;
  price?: number;
  image?: string;
  categoryId?: string;
  description?: string;
  sizes?: unknown;
  composition?: unknown;
  discount?: number;
}

// Типы для категорий
export type CategorySection = 'clothing' | 'accessories';

export interface Category {
  id: string;
  name: string;
  section: CategorySection;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  section: CategorySection;
  order: number;
}

export interface UpdateCategoryData {
  name?: string;
  section?: CategorySection;
  order?: number;
}

// Ответ API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
