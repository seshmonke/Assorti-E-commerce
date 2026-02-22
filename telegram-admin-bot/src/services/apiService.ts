import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import {
  Product,
  Category,
  CreateProductData,
  UpdateProductData,
  CreateCategoryData,
  UpdateCategoryData,
  ApiResponse,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: env.BACKEND_API_URL,
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${env.API_SECRET_TOKEN}`,
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const method = config.method?.toUpperCase() ?? 'UNKNOWN';
        const url = config.url ?? '';
        const body = config.data ? JSON.stringify(config.data) : null;
        const bodyPart = body ? ` | Body: ${body}` : '';
        logger.info(`→ ${method} ${config.baseURL}${url}${bodyPart}`);
        (config as any)._requestStart = Date.now();
        return config;
      },
      (error) => {
        logger.error('Request setup error', { message: error.message });
        throw error;
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        const method = response.config.method?.toUpperCase() ?? 'UNKNOWN';
        const url = response.config.url ?? '';
        const duration = Date.now() - ((response.config as any)._requestStart ?? Date.now());
        logger.info(`← ${response.status} ${method} ${url} (${duration}ms)`);
        return response;
      },
      (error) => {
        logger.error('API Error:', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  // ===== ТОВАРЫ =====

  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await this.api.get<ApiResponse<Product[]>>('/products');
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get products', error);
      throw error;
    }
  }

  async getProductsByCategoryId(categoryId: string): Promise<Product[]> {
    try {
      const response = await this.api.get<ApiResponse<Product[]>>(`/products/category/${categoryId}`);
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get products by category', { categoryId, error });
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await this.api.get<ApiResponse<Product>>(`/products/${id}`);
      return response.data.data || null;
    } catch (error) {
      logger.error('Failed to get product', { id, error });
      throw error;
    }
  }

  async createProduct(data: CreateProductData): Promise<Product> {
    try {
      const response = await this.api.post<ApiResponse<Product>>('/products', data);
      if (!response.data.data) {
        throw new Error('No data returned from server');
      }
      return response.data.data;
    } catch (error) {
      logger.error('Failed to create product', { data, error });
      throw error;
    }
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    try {
      const response = await this.api.put<ApiResponse<Product>>(`/products/${id}`, data);
      if (!response.data.data) {
        throw new Error('No data returned from server');
      }
      return response.data.data;
    } catch (error) {
      logger.error('Failed to update product', { id, data, error });
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await this.api.delete(`/products/${id}`);
    } catch (error) {
      logger.error('Failed to delete product', { id, error });
      throw error;
    }
  }

  // ===== КАТЕГОРИИ =====

  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await this.api.get<ApiResponse<Category[]>>('/categories');
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get categories', error);
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const response = await this.api.get<ApiResponse<Category>>(`/categories/${id}`);
      return response.data.data || null;
    } catch (error) {
      logger.error('Failed to get category', { id, error });
      throw error;
    }
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    try {
      const response = await this.api.post<ApiResponse<Category>>('/categories', data);
      if (!response.data.data) {
        throw new Error('No data returned from server');
      }
      return response.data.data;
    } catch (error) {
      logger.error('Failed to create category', { data, error });
      throw error;
    }
  }

  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    try {
      const response = await this.api.put<ApiResponse<Category>>(`/categories/${id}`, data);
      if (!response.data.data) {
        throw new Error('No data returned from server');
      }
      return response.data.data;
    } catch (error) {
      logger.error('Failed to update category', { id, data, error });
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await this.api.delete(`/categories/${id}`);
    } catch (error) {
      logger.error('Failed to delete category', { id, error });
      throw error;
    }
  }
}

export const apiService = new ApiService();
