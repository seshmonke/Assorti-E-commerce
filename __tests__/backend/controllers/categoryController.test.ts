import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

vi.mock('../../../backend-new/src/lib/prisma.js', () => ({ prisma: {} }))
vi.mock('../../../backend-new/src/utils/authLogger.js', () => ({ logAuthDenied: vi.fn() }))

vi.mock('../../../backend-new/src/models/categoryModel.js', () => ({
  CategoryModel: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getMaxOrder: vi.fn(),
    renumberSection: vi.fn(),
  },
}))

import { CategoryController } from '../../../backend-new/src/controllers/categoryController.js'
import { CategoryModel } from '../../../backend-new/src/models/categoryModel.js'
import { mockCategory, mockCategories } from '../../fixtures/categories.js'

function createMockReqRes(overrides: Partial<Request> = {}) {
  const req = { params: {}, query: {}, body: {}, ...overrides } as unknown as Request
  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response
  const next = vi.fn() as NextFunction
  return { req, res, next }
}

describe('CategoryController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── getAllCategories ─────────────────────────────────────────────────────

  describe('getAllCategories', () => {
    it('возвращает все категории', async () => {
      vi.mocked(CategoryModel.findAll).mockResolvedValue(mockCategories)

      const { req, res, next } = createMockReqRes()
      await CategoryController.getAllCategories(req, res, next)

      expect(CategoryModel.findAll).toHaveBeenCalledOnce()
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockCategories })
    })

    it('вызывает next(error) при ошибке', async () => {
      const err = new Error('DB error')
      vi.mocked(CategoryModel.findAll).mockRejectedValue(err)

      const { req, res, next } = createMockReqRes()
      await CategoryController.getAllCategories(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
    })
  })

  // ─── getCategoryById ──────────────────────────────────────────────────────

  describe('getCategoryById', () => {
    it('возвращает категорию по ID', async () => {
      vi.mocked(CategoryModel.findById).mockResolvedValue(mockCategory)

      const { req, res, next } = createMockReqRes({ params: { id: 'cat-001' } as any })
      await CategoryController.getCategoryById(req, res, next)

      expect(CategoryModel.findById).toHaveBeenCalledWith('cat-001')
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockCategory })
    })

    it('возвращает 404 если категория не найдена', async () => {
      vi.mocked(CategoryModel.findById).mockResolvedValue(null)

      const { req, res, next } = createMockReqRes({ params: { id: 'nonexistent' } as any })
      await CategoryController.getCategoryById(req, res, next)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Category not found' })
    })
  })

  // ─── createCategory ───────────────────────────────────────────────────────

  describe('createCategory', () => {
    it('создаёт категорию и возвращает 201', async () => {
      vi.mocked(CategoryModel.getMaxOrder).mockResolvedValue(2)
      vi.mocked(CategoryModel.create).mockResolvedValue(mockCategory)

      const { req, res, next } = createMockReqRes({
        body: { name: 'Футболки', section: 'clothing' },
      })
      await CategoryController.createCategory(req, res, next)

      expect(CategoryModel.getMaxOrder).toHaveBeenCalledWith('clothing')
      expect(CategoryModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Футболки', section: 'clothing', order: 3 }),
      )
      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('возвращает 400 если отсутствует name', async () => {
      const { req, res, next } = createMockReqRes({
        body: { section: 'clothing' },
      })
      await CategoryController.createCategory(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required fields: name, section',
      })
    })

    it('возвращает 400 при невалидном section', async () => {
      const { req, res, next } = createMockReqRes({
        body: { name: 'Тест', section: 'invalid_section' },
      })
      await CategoryController.createCategory(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Section must be "clothing" or "accessories"',
      })
    })
  })

  // ─── deleteCategory ───────────────────────────────────────────────────────

  describe('deleteCategory', () => {
    it('удаляет категорию и перенумеровывает раздел', async () => {
      vi.mocked(CategoryModel.findById).mockResolvedValue(mockCategory)
      vi.mocked(CategoryModel.delete).mockResolvedValue(mockCategory)
      vi.mocked(CategoryModel.renumberSection).mockResolvedValue(undefined)

      const { req, res, next } = createMockReqRes({ params: { id: 'cat-001' } as any })
      await CategoryController.deleteCategory(req, res, next)

      expect(CategoryModel.delete).toHaveBeenCalledWith('cat-001')
      expect(CategoryModel.renumberSection).toHaveBeenCalledWith('clothing')
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockCategory }),
      )
    })
  })
})
