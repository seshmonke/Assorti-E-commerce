import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

vi.mock('../../../backend/src/lib/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}))
vi.mock('../../../backend/src/utils/authLogger.js', () => ({ logAuthDenied: vi.fn() }))

vi.mock('../../../backend/src/models/orderModel.js', () => ({
  OrderModel: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByStatus: vi.fn(),
    findByTelegramUserId: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../../backend/src/models/productModel.js', () => ({
  ProductModel: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByIdIncludingArchived: vi.fn(),
    findByCategory: vi.fn(),
    findOnSale: vi.fn(),
    findAllArchived: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
  },
}))

import { OrderController } from '../../../backend/src/controllers/orderController.js'
import { OrderModel } from '../../../backend/src/models/orderModel.js'
import { ProductModel } from '../../../backend/src/models/productModel.js'
import { prisma } from '../../../backend/src/lib/prisma.js'
import { mockOrder, mockOrders, mockPaidOrder, mockCancelledOrder } from '../../fixtures/orders.js'
import { mockProduct } from '../../fixtures/products.js'

function createMockReqRes(overrides: Record<string, unknown> = {}) {
  const req = {
    params: {},
    query: {},
    body: {},
    user: undefined,
    ...overrides,
  } as unknown as Request
  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response
  const next = vi.fn() as NextFunction
  return { req, res, next }
}

describe('OrderController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── getMyOrders ──────────────────────────────────────────────────────────

  describe('getMyOrders', () => {
    it('возвращает заказы текущего пользователя', async () => {
      vi.mocked(OrderModel.findByTelegramUserId).mockResolvedValue([mockOrder])

      const { req, res, next } = createMockReqRes({
        user: { telegramId: '123456789', userId: 'user-001' } as any,
      })
      await OrderController.getMyOrders(req, res, next)

      expect(OrderModel.findByTelegramUserId).toHaveBeenCalledWith('123456789')
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [mockOrder] })
    })

    it('возвращает 401 если пользователь не аутентифицирован', async () => {
      const { req, res, next } = createMockReqRes({ user: undefined as any })
      await OrderController.getMyOrders(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'User not authenticated' })
    })
  })

  // ─── getAllOrders ─────────────────────────────────────────────────────────

  describe('getAllOrders', () => {
    it('возвращает все заказы без фильтра', async () => {
      vi.mocked(OrderModel.findAll).mockResolvedValue(mockOrders)

      const { req, res, next } = createMockReqRes({ query: {} as any })
      await OrderController.getAllOrders(req, res, next)

      expect(OrderModel.findAll).toHaveBeenCalledOnce()
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockOrders })
    })

    it('фильтрует заказы по статусу', async () => {
      vi.mocked(OrderModel.findByStatus).mockResolvedValue([mockPaidOrder])

      const { req, res, next } = createMockReqRes({ query: { status: 'paid' } as any })
      await OrderController.getAllOrders(req, res, next)

      expect(OrderModel.findByStatus).toHaveBeenCalledWith('paid')
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [mockPaidOrder] })
    })
  })

  // ─── getOrderById ─────────────────────────────────────────────────────────

  describe('getOrderById', () => {
    it('возвращает заказ по ID', async () => {
      vi.mocked(OrderModel.findById).mockResolvedValue(mockOrder)

      const { req, res, next } = createMockReqRes({ params: { id: 'order-001' } as any })
      await OrderController.getOrderById(req, res, next)

      expect(OrderModel.findById).toHaveBeenCalledWith('order-001')
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockOrder })
    })

    it('возвращает 404 если заказ не найден', async () => {
      vi.mocked(OrderModel.findById).mockResolvedValue(null)

      const { req, res, next } = createMockReqRes({ params: { id: 'nonexistent' } as any })
      await OrderController.getOrderById(req, res, next)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Order not found' })
    })
  })

  // ─── createOrder ──────────────────────────────────────────────────────────

  describe('createOrder', () => {
    it('возвращает 400 если items пустой', async () => {
      const { req, res, next } = createMockReqRes({
        body: { items: [], totalPrice: 1500 },
      })
      await OrderController.createOrder(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required field: items (must be a non-empty array)',
      })
    })

    it('возвращает 400 если отсутствует totalPrice', async () => {
      const { req, res, next } = createMockReqRes({
        body: { items: [{ productId: 'prod-001', price: 1500, name: 'Тест' }] },
      })
      await OrderController.createOrder(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required field: totalPrice',
      })
    })

    it('возвращает 404 если товар не найден', async () => {
      vi.mocked(ProductModel.findByIdIncludingArchived).mockResolvedValue(null)

      const { req, res, next } = createMockReqRes({
        body: {
          items: [{ productId: 'nonexistent', price: 1500, name: 'Тест' }],
          totalPrice: 1500,
        },
      })
      await OrderController.createOrder(req, res, next)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found: nonexistent',
      })
    })

    it('возвращает 400 если товар уже в архиве', async () => {
      const archivedProduct = { ...mockProduct, archive: true }
      vi.mocked(ProductModel.findByIdIncludingArchived).mockResolvedValue(archivedProduct)

      const { req, res, next } = createMockReqRes({
        body: {
          items: [{ productId: 'prod-003', price: 1000, name: 'Архивный' }],
          totalPrice: 1000,
        },
      })
      await OrderController.createOrder(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Cannot create order for archived product'),
      })
    })

    it('создаёт заказ через транзакцию и возвращает 201', async () => {
      vi.mocked(ProductModel.findByIdIncludingArchived).mockResolvedValue(mockProduct)
      vi.mocked(prisma.$transaction as any).mockImplementation(async (fn: any) => fn({
        order: { create: vi.fn().mockResolvedValue(mockOrder) },
        product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      }))

      const { req, res, next } = createMockReqRes({
        body: {
          items: [{ productId: 'prod-001', price: 1500, name: 'Тестовая футболка' }],
          totalPrice: 1500,
        },
      })
      await OrderController.createOrder(req, res, next)

      expect(prisma.$transaction).toHaveBeenCalledOnce()
      expect(res.status).toHaveBeenCalledWith(201)
    })
  })

  // ─── updateOrderStatus ────────────────────────────────────────────────────

  describe('updateOrderStatus', () => {
    it('обновляет статус заказа', async () => {
      const updatedOrder = { ...mockOrder, status: 'paid' as const }
      vi.mocked(OrderModel.findById).mockResolvedValue(mockOrder)
      vi.mocked(OrderModel.updateStatus).mockResolvedValue(updatedOrder)

      const { req, res, next } = createMockReqRes({
        params: { id: 'order-001' } as any,
        body: { status: 'paid' },
      })
      await OrderController.updateOrderStatus(req, res, next)

      expect(OrderModel.updateStatus).toHaveBeenCalledWith('order-001', { status: 'paid' })
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: updatedOrder }),
      )
    })

    it('возвращает 400 при невалидном статусе', async () => {
      const { req, res, next } = createMockReqRes({
        params: { id: 'order-001' } as any,
        body: { status: 'invalid_status' },
      })
      await OrderController.updateOrderStatus(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Invalid status'),
      })
    })
  })

  // ─── cancelOrder ──────────────────────────────────────────────────────────

  describe('cancelOrder', () => {
    it('отменяет заказ со статусом pending_payment', async () => {
      const cancelledOrder = { ...mockOrder, status: 'cancelled' as const }
      vi.mocked(OrderModel.findById).mockResolvedValue(mockOrder)
      vi.mocked(OrderModel.updateStatus).mockResolvedValue(cancelledOrder)

      const { req, res, next } = createMockReqRes({ params: { id: 'order-001' } as any })
      await OrderController.cancelOrder(req, res, next)

      expect(OrderModel.updateStatus).toHaveBeenCalledWith('order-001', { status: 'cancelled' })
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      )
    })

    it('возвращает 400 если заказ уже отменён', async () => {
      vi.mocked(OrderModel.findById).mockResolvedValue(mockCancelledOrder)

      const { req, res, next } = createMockReqRes({ params: { id: 'order-003' } as any })
      await OrderController.cancelOrder(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order is already cancelled',
      })
    })

    it('возвращает 400 если заказ уже оплачен', async () => {
      vi.mocked(OrderModel.findById).mockResolvedValue(mockPaidOrder)

      const { req, res, next } = createMockReqRes({ params: { id: 'order-002' } as any })
      await OrderController.cancelOrder(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Cannot cancel order with status: paid'),
      })
    })
  })
})
