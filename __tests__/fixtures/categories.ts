import type { ICategory } from '../../backend/src/types/index.js'

export const mockCategory: ICategory = {
  id: 'cat-001',
  name: 'Футболки',
  section: 'clothing',
  order: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

export const mockCategory2: ICategory = {
  id: 'cat-002',
  name: 'Аксессуары',
  section: 'accessories',
  order: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

export const mockCategories: ICategory[] = [mockCategory, mockCategory2]
