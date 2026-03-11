import type { IProduct } from '../../backend/src/types/index.js'
import { mockCategory } from './categories.js'

export const mockProduct: IProduct = {
  id: 'prod-001',
  name: 'Тестовая футболка',
  price: 1500,
  images: ['https://example.com/img1.jpg'],
  categoryId: 'cat-001',
  category: mockCategory,
  description: 'Описание тестовой футболки',
  sizes: 'M',
  composition: { cotton: 100 },
  discount: null,
  archive: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

export const mockProductOnSale: IProduct = {
  id: 'prod-002',
  name: 'Футболка со скидкой',
  price: 2000,
  images: ['https://example.com/img2.jpg'],
  categoryId: 'cat-001',
  category: mockCategory,
  description: 'Описание со скидкой',
  sizes: 'XL',
  composition: { cotton: 80, polyester: 20 },
  discount: 20,
  archive: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

export const mockArchivedProduct: IProduct = {
  id: 'prod-003',
  name: 'Архивная футболка',
  price: 1000,
  images: [],
  categoryId: 'cat-001',
  category: mockCategory,
  description: 'Архивный товар',
  sizes: 'S',
  composition: {},
  discount: null,
  archive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

export const mockProducts: IProduct[] = [mockProduct, mockProductOnSale]
