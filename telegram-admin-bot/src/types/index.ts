// Типы для товаров (соответствуют бэкенду)
export type ProductCategory =
  | 'all'
  | 'tshirts'
  | 'jeans'
  | 'jackets'
  | 'hats'
  | 'belts'
  | 'glasses'
  | 'shoes'
  | 'bags';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: ProductCategory;
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
  category: ProductCategory;
  description: string;
  sizes: unknown;
  composition: unknown;
  discount?: number;
}

export interface UpdateProductData {
  name?: string;
  price?: number;
  image?: string;
  category?: ProductCategory;
  description?: string;
  sizes?: unknown;
  composition?: unknown;
  discount?: number;
}

// Типы для категорий
export type CategorySection = 'clothing' | 'accessories';

export interface Category {
  id: number;
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
