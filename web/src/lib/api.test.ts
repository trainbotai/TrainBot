import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { apiFetch, ApiError } from './api'

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON on 200', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ hello: 'world' }),
    })
    const data = await apiFetch<{ hello: string }>('/x')
    expect(data.hello).toBe('world')
  })

  it('returns undefined on 204', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
    })
    const data = await apiFetch<undefined>('/x', { method: 'DELETE' })
    expect(data).toBeUndefined()
  })

  it('throws ApiError with detail on non-2xx', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Bad creds' }),
    })
    await expect(apiFetch('/x')).rejects.toThrow(ApiError)
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 401, message: 'Bad creds' })
  })

  it('attaches Authorization header when token provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
    vi.stubGlobal('fetch', mockFetch)
    await apiFetch('/x', {}, 'tok-123')
    const callInit = mockFetch.mock.calls[0][1] as RequestInit
    const headers = callInit.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer tok-123')
  })
})
