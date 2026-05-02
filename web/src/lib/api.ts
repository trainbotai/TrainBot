import type { ProblemDetail } from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export class ApiError extends Error {
  constructor(public status: number, message: string, public problem?: ProblemDetail) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let problem: ProblemDetail | undefined
    try { problem = await res.json() } catch { /* ignore non-JSON body */ }
    const message = problem?.detail ?? problem?.title ?? `HTTP ${res.status}`
    throw new ApiError(res.status, message, problem)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
