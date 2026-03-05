import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

// Мокаем Prisma и зависимости ДО импорта контроллера
vi.mock('../../../backend-new/src/lib/prisma.js', () => ({
  prisma: {},
}))
vi.mock('../../../backend-new/src/utils/authLogger.js', () => ({
  logAuthDenied: vi.fn(),
}))

// Мокаем ProductModel
vi.mock('../../../backend-new/src/models/productModel.js', () => ({
  ProductModel: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCategory: vi.fn(),
    findOnSale: vi.fn(),
    findAllArchived: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
    findByIdIncludingArchived: vi.fn(),
  },
}))

import { ProductController } from '../../../backend-new/src/controllers/productController.js'
import { ProductModel } from '../../../backend-new/src/models/productModel.js'
import { mockProduct, mockProducts, mockArchivedProduct, mockProductOnSale } from '../../fixtures/products.js'

// Хелпер для создания мок req/res/next
function createMockReqRes(overrides: Partial<Request> = {}) {
  const req = {
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request

  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response

  const next = vi.fn() as NextFunction

  return { req, res, next }
}

describe('ProductController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── getAllProducts ───────────────────────────────────────────────────────

  describe('getAllProducts', () => {
    it('возвращает список всех продуктов с success: true', async () => {
      vi.mocked(ProductModel.findAll).mockResolvedValue(mockProducts)

      const { req, res, next } = createMockReqRes()
      await ProductController.getAllProducts(req, res, next)

      expect(ProductModel.findAll).toHaveBeenCalledOnce()
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts,
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('вызывает next(error) при ошибке БД', async () => {
      const dbError = new Error('Database connection failed')
      vi.mocked(ProductModel.findAll).mockRejectedValue(dbError)

      const { req, res, next } = createMockReqRes()
      await ProductController.getAllProducts(req, res, next)

      expect(next).toHaveBeenCalledWith(dbError)
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  // ─── getProductById ───────────────────────────────────────────────────────

  describe('getProductById', () => {
    it('воз��ращает продукт по ID', async () => {
      vi.mocked(ProductModel.findById).mockResolvedValue(mockProduct)

      const { req, res, next } = createMockReqRes({ params: { id: 'prod-001' } as any })
      await ProductController.getProductById(req, res, next)

      expect(ProductModel.findById).toHaveBeenCalledWith('prod-001')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProduct,
      })
    })

    it('возвращает 404 если продукт не найден', async () => {
      vi.mocked(ProductModel.findById).mockResolvedValue(null)

      const { req, res, next } = createMockReqRes({ params: { id: 'nonexistent' } as any })
      await ProductController.getProductById(req, res, next)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found',
      })
    })
  })

  // ─── getProductsByCategory ────────────────────────────────────────────────

  describe('getProductsByCategory', () => {
    it('возвращает продукты по categoryId', async () => {
      vi.mocked(ProductModel.findByCategory).mockResolvedValue([mockProduct])

      const { req, res, next } = createMockReqRes({ params: { categoryId: 'cat-001' } as any })
      await ProductController.getProductsByCategory(req, res, next)

      expect(ProductModel.findByCategory).toHaveBeenCalledWith('cat-001')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [mockProduct],
      })
    })
  })

  // ─── getProductsOnSale ───────��────────────────────────────────────────────

  describe('getProductsOnSale', () => {
    it('возвращает товары со скидкой', async () => {
      vi.mocked(ProductModel.findOnSale).mockResolvedValue([mockProductOnSale])

      const { req, res, next } = createMockReqRes()
      await ProductController.getProductsOnSale(req, res, next)

      expect(ProductModel.findOnSale).toHaveBeenCalledOnce()
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [mockProductOnSale],
      })
    })
  })

  // ─── searchProducts ───────────────────────────────────────────────────────

  describe('searchProducts', () => {
    it('возвращает результаты поиска', async () => {
      vi.mocked(ProductModel.search).mockResolvedValue([mockProduct])

      const { req, res, next } = createMockReqRes({ query: { q: 'футболка' } as any })
      await ProductController.searchProducts(req, res, next)

      expect(ProductModel.search).toHaveBeenCalledWith('футболка')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [mockProduct],
      })
    })

    it('возвращает 400 если query пустой', async () => {
      const { req, res, next } = createMockReqRes({ query: {} as any })
      await ProductController.searchProducts(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Search query is required',
      })
      expect(ProductModel.search).not.toHaveBeenCalled()
    })
  })

  // ─── getArchivedProducts ──────────────────────────────────────────────────

  describe('getArchivedProducts', () => {
    it('возвращает архивированные продукты', async () => {
      vi.mocked(ProductModel.findAllArchived).mockResolvedValue([mockArchivedProduct])

      const { req, res, next } = createMockReqRes()
      await ProductController.getArchivedProducts(req, res, next)

      expect(ProductModel.findAllArchived).toHaveBeenCalledOnce()
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [mockArchivedProduct],
      })
    })
  })

  // ─── createProduct ────────────────────────────────────────────────────────

  describe('createProduct', () => {
    it('создаёт продукт и возвращает 201', async () => {
      vi.mocked(ProductModel.create).mockResolvedValue(mockProduct)

      const { req, res, next } = createMockReqRes({
        body: {
          name: 'Тестовая футболка',
          price: 1500,
          categoryId: 'cat-001',
          description: 'Описание',
          images: [],
          sizes: ['S', 'M'],
          composition: {},
        },
      })
      await ProductController.createProduct(req, res, next)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockProduct }),
      )
    })

    it('возвращает 400 если отсутствуют обязательные поля', async () => {
      const { req, res, next } = createMockReqRes({
        body: { name: 'Без цены' },
      })
      await ProductController.createProduct(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required fields: name, price, categoryId',
      })
      expect(ProductModel.create).not.toHaveBeenCalled()
    })
  })

  // ─── updateProduct ────────────────────────────────────────────────────────

  describe('updateProduct', () => {
    it('обновляет продукт и возвращает обновлённые данные', async () => {
      const updated = { ...mockProduct, name: 'Обновлённая футболка' }
      vi.mocked(ProductModel.update).mockResolvedValue(updated)

      const { req, res, next } = createMockReqRes({
        params: { id: 'prod-001' } as any,
        body: { name: 'Обновлённая футболка' },
      })
      await ProductController.updateProduct(req, res, next)

      expect(ProductModel.update).toHaveBeenCalledWith('prod-001', { name: 'Обновлённая футболка' })
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: updated }),
      )
    })
  })

  // ─── deleteProduct ────────────────────────────────────────────────────────

  describe('deleteProduct', () => {
    it('удаляет продукт и возвращает удалённый объект', async () => {
      vi.mocked(ProductModel.delete).mockResolvedValue(mockProduct)

      const { req, res, next } = createMockReqRes({ params: { id: 'prod-001' } as any })
      await ProductController.deleteProduct(req, res, next)

      expect(ProductModel.delete).toHaveBeenCalledWith('prod-001')
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockProduct }),
      )
    })
  })
})
