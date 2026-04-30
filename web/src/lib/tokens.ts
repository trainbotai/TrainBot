import type { AuthUser } from './types'

const ACCESS_KEY = 'tb.accessToken'
const REFRESH_KEY = 'tb.refreshToken'
const USER_KEY = 'tb.user'

export function saveTokens(access: string, refresh: string, user: AuthUser): void {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function loadTokens(): { access: string | null; refresh: string | null; user: AuthUser | null } {
  const userRaw = localStorage.getItem(USER_KEY)
  let user: AuthUser | null = null
  if (userRaw) {
    try { user = JSON.parse(userRaw) as AuthUser } catch { user = null }
  }
  return {
    access: localStorage.getItem(ACCESS_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
    user,
  }
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}
