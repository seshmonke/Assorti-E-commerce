// Типы для товаров (соответствуют бэкенду)
export interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  categoryId: string;
  category?: Category;
  description: string;
  sizes: string;
  composition: unknown;
  discount: number | null;
  archive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  price: number;
  images: string[];
  categoryId: string;
  description: string;
  sizes: string;
  composition: unknown;
  discount?: number;
}

export interface UpdateProductData {
  name?: string;
  price?: number;
  images?: string[];
  categoryId?: string;
  description?: string;
  sizes?: string;
  composition?: unknown;
  discount?: number;
  archive?: boolean;
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
  order?: number;
}

export interface UpdateCategoryData {
  name?: string;
  section?: CategorySection;
  order?: number;
}

// Типы для заказов
export type OrderStatus = 'pending_payment' | 'paid' | 'delivered' | 'cancelled';
export type PaymentMethod = 'card' | 'cash';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  name: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentId: string | null;
  confirmationUrl: string | null;
  telegramUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemData {
  productId: string;
  quantity?: number;
  price: number;
  name: string;
}

export interface CreateOrderData {
  items: CreateOrderItemData[];
  totalPrice: number;
  telegramUserId?: string;
  paymentMethod?: PaymentMethod;
}

export interface UpdateOrderStatusData {
  status: OrderStatus;
  paymentId?: string;
}

// Результат создания платежа
export interface PaymentResult {
  paymentId: string;
  confirmationUrl: string;
  status: string;
}

// Результат проверки оплаты
export interface PaymentCheckResult {
  paymentStatus: string;
  orderStatus: string;
}

// Типы для архива
export interface Archive {
  id: string;
  name: string;
  price: number;
  images: string[];
  categoryId: string;
  category?: Category;
  categoryName?: string;
  description: string;
  sizes: unknown;
  composition: unknown;
  discount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArchiveData {
  name: string;
  price: number;
  images: string[];
  categoryId: string;
  description: string;
  sizes: unknown;
  composition: unknown;
  discount?: number;
}

// Ответ API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
