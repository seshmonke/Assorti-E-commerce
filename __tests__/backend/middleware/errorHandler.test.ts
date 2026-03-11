import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { errorHandler } from '../../../backend/src/middleware/errorHandler.js'

function createMockReqRes() {
  const req = {} as Request
  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response
  const next = vi.fn() as NextFunction
  return { req, res, next }
}

describe('errorHandler middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('возвращает 500 и сообщение об ошибке по умолчанию', () => {
    const { req, res, next } = createMockReqRes()
    const err = new Error('Something went wrong')

    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.any(String),
      }),
    )
  })

  it('всегда возвращает 500 (statusCode из ошибки не используется)', () => {
    const { req, res, next } = createMockReqRes()
    const err = Object.assign(new Error('Not found'), { statusCode: 404 })

    errorHandler(err, req, res, next)

    // errorHandler в текущей реализации всегда возвращает 500
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('возвращает message из ошибки', () => {
    const { req, res, next } = createMockReqRes()
    const err = new Error('Custom error message')

    errorHandler(err, req, res, next)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Custom error message',
      }),
    )
  })
})
