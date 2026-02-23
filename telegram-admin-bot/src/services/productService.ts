import { apiService } from './apiService';
import { logger } from '../utils/logger';
import { Product, Category, CreateProductData, UpdateProductData, CreateCategoryData, UpdateCategoryData } from '../types';

class ProductService {
  // ===== ТОВАРЫ =====

  async getProductById(id: string): Promise<Product | null> {
    try {
      return await apiService.getProductById(id);
    } catch (error) {
      logger.error('Failed to get product', { id, error });
      throw error;
    }
  }

  async createProduct(data: CreateProductData): Promise<Product> {
    try {
      const product = await apiService.createProduct(data);
      logger.info('Product created successfully', { productId: product.id });
      return product;
    } catch (error) {
      logger.error('Failed to create product', { data, error });
      throw error;
    }
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    try {
      const product = await apiService.updateProduct(id, data);
      logger.info('Product updated successfully', { productId: id });
      return product;
    } catch (error) {
      logger.error('Failed to update product', { id, data, error });
      throw error;
    }
  }

  // ===== КАТЕГОРИИ =====

  async getCategoryById(id: string): Promise<Category | null> {
    try {
      return await apiService.getCategoryById(id);
    } catch (error) {
      logger.error('Failed to get category', { id, error });
      throw error;
    }
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    try {
      const category = await apiService.createCategory(data);
      logger.info('Category created successfully', { categoryId: category.id });
      return category;
    } catch (error) {
      logger.error('Failed to create category', { data, error });
      throw error;
    }
  }

  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    try {
      const category = await apiService.updateCategory(id, data);
      logger.info('Category updated successfully', { categoryId: id });
      return category;
    } catch (error) {
      logger.error('Failed to update category', { id, data, error });
      throw error;
    }
  }
}

export const productService = new ProductService();
