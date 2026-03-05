import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Мокаем localStorage для frontend тестов
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Мокаем dotenv/config чтобы не падало в backend тестах
vi.mock('dotenv/config', () => ({}))
