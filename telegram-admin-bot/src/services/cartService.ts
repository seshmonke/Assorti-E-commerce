import type { Product } from '../types';

/**
 * In-memory корзина для каждого пользователя Telegram.
 * Ключ — telegramUserId (строка), значение — массив товаров.
 */
const carts = new Map<string, Product[]>();

export const cartService = {
  /**
   * Получить корзину пользователя
   */
  getCart(userId: string): Product[] {
    return carts.get(userId) ?? [];
  },

  /**
   * Добавить товар в корзину
   */
  addToCart(userId: string, product: Product): void {
    const cart = carts.get(userId) ?? [];
    cart.push(product);
    carts.set(userId, cart);
  },

  /**
   * Удалить товар из корзины по индексу (0-based)
   */
  removeFromCartByIndex(userId: string, index: number): Product | null {
    const cart = carts.get(userId) ?? [];
    if (index < 0 || index >= cart.length) return null;
    const [removed] = cart.splice(index, 1);
    carts.set(userId, cart);
    return removed ?? null;
  },

  /**
   * Удалить товар из корзины по ID
   */
  removeFromCartById(userId: string, productId: string): Product | null {
    const cart = carts.get(userId) ?? [];
    const index = cart.findIndex((p) => p.id === productId);
    if (index === -1) return null;
    const [removed] = cart.splice(index, 1);
    carts.set(userId, cart);
    return removed ?? null;
  },

  /**
   * Очистить корзину пользователя
   */
  clearCart(userId: string): void {
    carts.delete(userId);
  },

  /**
   * Получить общую сумму корзины
   */
  getTotalPrice(userId: string): number {
    const cart = carts.get(userId) ?? [];
    return cart.reduce((sum, p) => sum + p.price, 0);
  },

  /**
   * Проверить, есть ли товар уже в корзине
   */
  isInCart(userId: string, productId: string): boolean {
    const cart = carts.get(userId) ?? [];
    return cart.some((p) => p.id === productId);
  },
};
