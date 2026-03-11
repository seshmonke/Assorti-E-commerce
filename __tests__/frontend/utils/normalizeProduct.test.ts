import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Product } from '../../../frontend/src/services/api.js'

// Мокаем axios и logger чтобы не падало при импорте api.ts
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: { baseURL: '' },
  }
  return { default: mockAxios, isAxiosError: vi.fn() }
})

vi.mock('../../../frontend/src/utils/logger.js', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import axios from 'axios'

// Базовый продукт с корректными данными
const baseProduct: Product = {
  id: 'prod-001',
  name: 'Тестовая футболка',
  price: 1500,
  images: ['https://example.com/img1.jpg'],
  categoryId: 'cat-001',
  description: 'Описание',
  sizes: 'M',
  composition: { cotton: 100 },
  discount: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('API normalizeProduct (через fetchAllProducts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('возвращает продукты с корректной строкой sizes', async () => {
    const { fetchAllProducts } = await import('../../../frontend/src/services/api.js')

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { success: true, data: [baseProduct] },
    })

    const products = await fetchAllProducts()
    expect(products[0].sizes).toBe('M')
  })

  it('возвращает sizes как строку если пришла строка', async () => {
    const { fetchAllProducts } = await import('../../../frontend/src/services/api.js')

    const productWithStringSizes = {
      ...baseProduct,
      sizes: 'XL',
    }

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { success: true, data: [productWithStringSizes] },
    })

    const products = await fetchAllProducts()
    expect(products[0].sizes).toBe('XL')
  })

  it('парсит images из JSON-строки', async () => {
    const { fetchAllProducts } = await import('../../../frontend/src/services/api.js')

    const productWithStringImages = {
      ...baseProduct,
      images: '["https://example.com/img1.jpg"]' as unknown as string[],
    }

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { success: true, data: [productWithStringImages] },
    })

    const products = await fetchAllProducts()
    expect(products[0].images).toEqual(['https://example.com/img1.jpg'])
  })

  it('оборачивает одиночный URL в массив', async () => {
    const { fetchAllProducts } = await import('../../../frontend/src/services/api.js')

    const productWithSingleImage = {
      ...baseProduct,
      images: 'https://example.com/img1.jpg' as unknown as string[],
    }

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { success: true, data: [productWithSingleImage] },
    })

    const products = await fetchAllProducts()
    expect(products[0].images).toEqual(['https://example.com/img1.jpg'])
  })

  it('возвращает пустой массив images если null', async () => {
    const { fetchAllProducts } = await import('../../../frontend/src/services/api.js')

    const productWithNullImages = {
      ...baseProduct,
      images: null as unknown as string[],
    }

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { success: true, data: [productWithNullImages] },
    })

    const products = await fetchAllProducts()
    expect(products[0].images).toEqual([])
  })

  it('парсит composition из JSON-строки', async () => {
    const { fetchAllProducts } = await import('../../../frontend/src/services/api.js')

    const productWithStringComposition = {
      ...baseProduct,
      composition: '{"cotton":100}' as unknown as Record<string, number>,
    }

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { success: true, data: [productWithStringComposition] },
    })

    const products = await fetchAllProducts()
    expect(products[0].composition).toEqual({ cotton: 100 })
  })

  it('бросает ошибку если success: false', async () => {
    const { fetchAllProducts } = await import('../../../frontend/src/services/api.js')

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { success: false, error: 'Server error' },
    })

    await expect(fetchAllProducts()).rejects.toThrow('Server error')
  })
})
