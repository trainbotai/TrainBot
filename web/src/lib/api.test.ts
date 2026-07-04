import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { apiFetch, ApiError } from './api'

const { mockRefresh, mockLogout, mockGetState } = vi.hoisted(() => {
  const mockRefresh = vi.fn()
  const mockLogout = vi.fn()
  const mockGetState = vi.fn(() => ({
    refresh: mockRefresh,
    logout: mockLogout,
    accessToken: 'tok-nou',
  }))
  return { mockRefresh, mockLogout, mockGetState }
})

vi.mock('../auth/authStore', () => ({
  useAuthStore: { getState: mockGetState },
}))

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

  it('on 401 with token: refreshes once and retries with the new token', async () => {
    mockRefresh.mockResolvedValue(undefined)
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: 1 }) })
    vi.stubGlobal('fetch', mockFetch)

    const data = await apiFetch<{ ok: number }>('/classes', {}, 'tok-expirat')
    expect(data.ok).toBe(1)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    const retryHeaders = (mockFetch.mock.calls[1][1] as RequestInit).headers as Record<string, string>
    expect(retryHeaders['Authorization']).toBe('Bearer tok-nou')
  })

  it('on 401 with failed refresh: logs out and throws', async () => {
    mockRefresh.mockRejectedValue(new Error('refresh dead'))
    mockLogout.mockResolvedValue(undefined)
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    vi.stubGlobal('fetch', mockFetch)

    await expect(apiFetch('/classes', {}, 'tok-expirat')).rejects.toThrow(ApiError)
    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(1) // fără retry după logout
  })

  it('does not intercept 401 without token (login greșit)', async () => {
    mockRefresh.mockClear()
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ detail: 'Bad creds' }) })
    vi.stubGlobal('fetch', mockFetch)

    await expect(apiFetch('/auth/teacher/login', { method: 'POST' })).rejects.toThrow(ApiError)
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
