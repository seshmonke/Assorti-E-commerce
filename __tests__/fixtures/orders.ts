import type { IOrder, IBrowserUser } from '../../backend-new/src/types/index.js'
import { mockProduct, mockProductOnSale } from './products.js'

export const mockBrowserUser: IBrowserUser = {
  id: 'user-001',
  telegramId: null,
  name: 'Иван Тестов',
  phone: '+79001234567',
  email: 'test@example.com',
  telegram: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

export const mockOrder: IOrder = {
  id: 'order-001',
  items: [
    {
      id: 'item-001',
      orderId: 'order-001',
      productId: 'prod-001',
      product: mockProduct,
      quantity: 1,
      price: 1500,
      name: 'Тестовая футболка',
    },
  ],
  totalPrice: 1500,
  status: 'pending_payment',
  paymentMethod: 'card',
  paymentId: null,
  confirmationUrl: null,
  telegramUserId: null,
  userId: 'user-001',
  user: mockBrowserUser,
  deliveryCity: 'Москва',
  deliveryPvzCode: 'MSK001',
  deliveryPvzAddress: 'ул. Тестовая, 1',
  deliveryPrice: 300,
  trackNumber: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

export const mockPaidOrder: IOrder = {
  id: 'order-002',
  items: [
    {
      id: 'item-002',
      orderId: 'order-002',
      productId: 'prod-002',
      product: mockProductOnSale,
      quantity: 1,
      price: 1600,
      name: 'Футболка со скидкой',
    },
  ],
  totalPrice: 1600,
  status: 'paid',
  paymentMethod: 'card',
  paymentId: 'pay-001',
  confirmationUrl: null,
  telegramUserId: '123456789',
  userId: null,
  user: null,
  deliveryCity: null,
  deliveryPvzCode: null,
  deliveryPvzAddress: null,
  deliveryPrice: null,
  trackNumber: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

export const mockCancelledOrder: IOrder = {
  ...mockOrder,
  id: 'order-003',
  status: 'cancelled',
}

export const mockOrders: IOrder[] = [mockOrder, mockPaidOrder]
