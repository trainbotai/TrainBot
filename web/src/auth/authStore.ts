import { create } from 'zustand'
import { apiFetch } from '../lib/api'
import { saveTokens, loadTokens, clearTokens } from '../lib/tokens'
import type { AuthResponse, AuthUser } from '../lib/types'

interface SignupInput {
  email: string
  password: string
  name: string
  tenantName: string
  tenantSlug: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const initial = loadTokens()

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initial.access,
  refreshToken: initial.refresh,
  user: initial.user,
  isAuthenticated: initial.user !== null,

  async login(email, password) {
    const res = await apiFetch<AuthResponse>('/auth/teacher/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    saveTokens(res.accessToken, res.refreshToken, res.user)
    set({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
      isAuthenticated: true,
    })
  },

  async signup(input) {
    const res = await apiFetch<AuthResponse>('/auth/teacher/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    saveTokens(res.accessToken, res.refreshToken, res.user)
    set({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
      isAuthenticated: true,
    })
  },

  async logout() {
    const { refreshToken } = get()
    if (refreshToken) {
      try {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        })
      } catch { /* swallow — local logout always succeeds */ }
    }
    clearTokens()
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false })
  },

  async refresh() {
    const { refreshToken } = get()
    if (!refreshToken) throw new Error('No refresh token')
    const res = await apiFetch<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
    saveTokens(res.accessToken, res.refreshToken, res.user)
    set({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
      isAuthenticated: true,
    })
  },
}))
