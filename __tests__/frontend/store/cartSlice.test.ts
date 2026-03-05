import { describe, it, expect } from 'vitest'
import { cartReducer, addToCart, removeFromCart, clearCart } from '../../../my-app/src/store/cartSlice.js'
import type { Product } from '../../../my-app/src/services/api.js'

// Мок-продукт совместимый с типом Product из api.ts
const productA: Product = {
  id: 'prod-001',
  name: 'Тестовая футболка',
  price: 1500,
  images: ['https://example.com/img1.jpg'],
  categoryId: 'cat-001',
  description: 'Описание',
  sizes: 'M',
  composition: {},
  discount: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const productB: Product = {
  id: 'prod-002',
  name: 'Футболка со скидкой',
  price: 2000,
  images: ['https://example.com/img2.jpg'],
  categoryId: 'cat-001',
  description: 'Описание со скидкой',
  sizes: 'XL',
  composition: {},
  discount: 20,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const emptyState = { items: [], totalPrice: 0, totalDiscount: 0 }

describe('cartSlice', () => {
  // ─── addToCart ────────────────────────────────────────────────────────────

  describe('addToCart', () => {
    it('добавляет товар в пустую корзину', () => {
      const state = cartReducer(emptyState, addToCart({ product: productA, size: 'M' }))

      expect(state.items).toHaveLength(1)
      expect(state.items[0]).toMatchObject({ id: 'prod-001', quantity: 1, size: 'M' })
    })

    it('не добавляет дубликат если товар с тем же id и size уже в корзине', () => {
      let state = cartReducer(emptyState, addToCart({ product: productA, size: 'M' }))
      state = cartReducer(state, addToCart({ product: productA, size: 'M' }))

      expect(state.items).toHaveLength(1)
      expect(state.items[0].quantity).toBe(1)
    })

    it('добавляет как отдельный товар если size отличается', () => {
      let state = cartReducer(emptyState, addToCart({ product: productA, size: 'M' }))
      state = cartReducer(state, addToCart({ product: productA, size: 'L' }))

      expect(state.items).toHaveLength(2)
    })

    it('добавляет несколько разных товаров', () => {
      let state = cartReducer(emptyState, addToCart({ product: productA, size: 'M' }))
      state = cartReducer(state, addToCart({ product: productB, size: 'XL' }))

      expect(state.items).toHaveLength(2)
    })

    it('корректно считает totalPrice без скидки', () => {
      const state = cartReducer(emptyState, addToCart({ product: productA, size: 'M' }))

      expect(state.totalPrice).toBe(1500)
    })

    it('корректно считает totalPrice со скидкой 20%', () => {
      const state = cartReducer(emptyState, addToCart({ product: productB, size: 'XL' }))

      // 2000 * (1 - 20/100) = 1600
      expect(state.totalPrice).toBe(1600)
    })

    it('сохраняет discount из продукта', () => {
      const state = cartReducer(emptyState, addToCart({ product: productB, size: 'XL' }))

      expect(state.items[0].discount).toBe(20)
    })
  })

  // ─── removeFromCart ───────────────────────────────────────────────────────

  describe('removeFromCart', () => {
    it('удаляет товар из корзины по id и size', () => {
      let state = cartReducer(emptyState, addToCart({ product: productA, size: 'M' }))
      state = cartReducer(state, removeFromCart({ id: 'prod-001', size: 'M' }))

      expect(state.items).toHaveLength(0)
    })

    it('не трогает другие товары при удалении', () => {
      let state = cartReducer(emptyState, addToCart({ product: productA, size: 'M' }))
      state = cartReducer(state, addToCart({ product: productB, size: 'XL' }))
      state = cartReducer(state, removeFromCart({ id: 'prod-001', size: 'M' }))

      expect(state.items).toHaveLength(1)
      expect(state.items[0].id).toBe('prod-002')
    })

    it('не удаляет товар с тем же id но другим size', () => {
      let state = cartReducer(emptyState, addToCart({ product: productA, size: 'M' }))
      state = cartReducer(state, addToCart({ product: productA, size: 'L' }))
      state = cartReducer(state, removeFromCart({ id: 'prod-001', size: 'M' }))

      expect(state.items).toHaveLength(1)
      expect(state.items[0].size).toBe('L')
    })
  })

  // ─── clearCart ────────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('очищает всю корзину', () => {
      let state = cartReducer(emptyState, addToCart({ product: productA, size: 'M' }))
      state = cartReducer(state, addToCart({ product: productB, size: 'XL' }))
      state = cartReducer(state, clearCart())

      expect(state.items).toHaveLength(0)
    })

    it('сбрасывает totalPrice в 0', () => {
      let state = cartReducer(emptyState, addToCart({ product: productA, size: 'M' }))
      state = cartReducer(state, clearCart())

      expect(state.totalPrice).toBe(0)
    })
  })
})
