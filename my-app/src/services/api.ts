import axios from 'axios';
import type { Category } from '../types/categories';
import { logger } from '../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    logger.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });
    return config;
  },
  (error) => {
    logger.error('[API] Request error', error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    logger.debug(`[API] Response ${response.status} ${response.config.url}`, {
      data: response.data,
    });
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      logger.error(`[API] Response error ${error.response?.status} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      logger.error('[API] Unknown error', error);
    }
    return Promise.reject(error);
  },
);

export interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  categoryId: string;
  category?: Category;
  description: string;
  sizes: string;
  composition: Record<string, number>;
  discount: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Нормализация JSON-полей продукта (sizes, composition, images).
 * SQLite + Prisma могут вернуть их как строку вместо объекта.
 */
function normalizeProduct(product: Product): Product {
  // sizes — обычная строка, парсинг не нужен
  const sizes: string = typeof product.sizes === 'string' ? product.sizes : String(product.sizes ?? '');

  const composition = (
    typeof product.composition === 'object'
    && product.composition !== null
    && !Array.isArray(product.composition)
  )
    ? product.composition as Record<string, number>
    : typeof product.composition === 'string'
      ? (() => { try { return JSON.parse(product.composition as unknown as string); } catch { return {}; } })()
      : {};

  let images: string[] = [];
  if (Array.isArray(product.images)) {
    images = product.images;
  } else if (typeof product.images === 'string') {
    const raw = product.images as string;
    // Может быть JSON-массив или одиночный URL (старая схема с полем image)
    if (raw.startsWith('[')) {
      try { images = JSON.parse(raw); } catch { images = []; }
    } else if (raw.length > 0) {
      images = [raw];
    }
  } else if (product.images == null) {
    images = [];
  }

  return { ...product, sizes, composition, images };
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

// ─── BrowserUser ────────────────────────────────────────────────────────────

export interface BrowserUser {
  id: string;
  telegramId: string | null;
  name: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterBrowserUserPayload {
  telegramId?: string;
  name: string;
  phone: string;
  email?: string;
  telegram?: string;
}

export async function registerBrowserUser(payload: RegisterBrowserUserPayload): Promise<BrowserUser> {
  const { data } = await api.post<ApiResponse<BrowserUser>>('/browser-users/register', payload);
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data;
}

// ─── CDEK ───────────────────────────────────────────���────────────────────���───

export interface CdekCity {
  code: number;
  city: string;
  region: string;
  country_code: string;
  full_name: string;
}

export interface CdekPvz {
  code: string;
  name: string;
  location: {
    address: string;
    city: string;
    region: string;
    latitude: number;
    longitude: number;
  };
  work_time: string;
  phones?: Array<{ number: string }>;
  type: string;
  is_handout: boolean;
  is_reception: boolean;
}

export interface CdekDeliveryCalc {
  tariff_code: number;
  tariff_name: string;
  delivery_sum: number;
  period_min: number;
  period_max: number;
  weight_calc: number;
}

export async function searchCdekCities(query: string): Promise<CdekCity[]> {
  const { data } = await api.get<ApiResponse<CdekCity[]>>('/cdek/cities', {
    params: { query },
  });
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data;
}

export async function fetchCdekPvz(cityCode: number): Promise<CdekPvz[]> {
  const { data } = await api.get<ApiResponse<CdekPvz[]>>('/cdek/pvz', {
    params: { city_code: cityCode },
  });
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data;
}

export async function calcCdekDelivery(cityCode: number, weight?: number): Promise<{
  tariffs: CdekDeliveryCalc[];
  recommended: CdekDeliveryCalc | undefined;
}> {
  const { data } = await api.post<ApiResponse<{
    tariffs: CdekDeliveryCalc[];
    recommended: CdekDeliveryCalc | undefined;
  }>>('/cdek/calc', { city_code: cityCode, weight });
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

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
  status: 'pending_payment' | 'paid' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentId: string | null;
  confirmationUrl: string | null;
  telegramUserId: string | null;
  userId: string | null;
  user?: BrowserUser | null;
  deliveryCity: string | null;
  deliveryPvzCode: string | null;
  deliveryPvzAddress: string | null;
  deliveryPrice: number | null;
  trackNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemPayload {
  productId: string;
  quantity?: number;
  price: number;
  name: string;
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[];
  totalPrice: number;
  telegramUserId?: string;
  paymentMethod?: 'card' | 'cash';
  userId?: string;
  deliveryCity?: string;
  deliveryPvzCode?: string;
  deliveryPvzAddress?: string;
  deliveryPrice?: number;
}

export async function fetchMyOrders(): Promise<Order[]> {
  const { data } = await api.get<ApiResponse<Order[]>>('/orders/my');
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data;
}

export async function fetchOrderById(id: string): Promise<Order> {
  const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`);
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data;
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<ApiResponse<Order>>('/orders', payload);
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface CreatePaymentResult {
  paymentId: string;
  confirmationUrl: string;
  confirmationToken: string;
  status: string;
}

export async function createPayment(orderId: string): Promise<CreatePaymentResult> {
  const { data } = await api.post<ApiResponse<CreatePaymentResult>>('/payments/create', { orderId });
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data;
}

export async function checkPaymentStatus(orderId: string): Promise<{
  paymentStatus: string;
  orderStatus: string;
}> {
  const { data } = await api.get<ApiResponse<{ paymentStatus: string; orderStatus: string }>>(
    `/payments/check/${orderId}`,
  );
  if (!data.success || data.data === undefined) {
    throw new Error(data.error ?? 'Unknown API error');
  }
  return data.data;
}
