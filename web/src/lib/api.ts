import type { ProblemDetail } from './types'
import { BASE_URL } from './config'

export class ApiError extends Error {
  constructor(public status: number, message: string, public problem?: ProblemDetail) {
    super(message)
    this.name = 'ApiError'
  }
}

// Un singur refresh concurent: toate cererile care primesc 401 simultan
// așteaptă același promise, nu declanșează N refresh-uri paralele.
let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  // import dinamic — evită ciclul de import la evaluarea modulelor
  const { useAuthStore } = await import('../auth/authStore')
  if (!refreshPromise) {
    refreshPromise = useAuthStore
      .getState()
      .refresh()
      .then(() => true)
      .catch(async () => {
        await useAuthStore.getState().logout()
        return false
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// Cerere cu Bearer + 401 → refresh → un singur retry. Întoarce Response-ul ok.
async function request(
  path: string,
  options: RequestInit,
  accessToken?: string,
  _retried = false,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    // Access token expirat → un singur refresh + retry, apoi logout la eșec.
    if (res.status === 401 && accessToken && !_retried && !path.startsWith('/auth/')) {
      const refreshed = await tryRefresh()
      if (refreshed) {
        const { useAuthStore } = await import('../auth/authStore')
        const newToken = useAuthStore.getState().accessToken ?? undefined
        return request(path, options, newToken, true)
      }
    }
    let problem: ProblemDetail | undefined
    try { problem = await res.json() } catch { /* ignore non-JSON body */ }
    const message = problem?.detail ?? problem?.title ?? `HTTP ${res.status}`
    throw new ApiError(res.status, message, problem)
  }
  return res
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const res = await request(path, options, accessToken)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function apiFetchBlob(path: string, accessToken?: string): Promise<Blob> {
  return (await request(path, {}, accessToken)).blob()
}
