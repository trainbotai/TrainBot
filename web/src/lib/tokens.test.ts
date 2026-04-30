import { describe, it, expect, beforeEach } from 'vitest'
import { saveTokens, loadTokens, clearTokens } from './tokens'

describe('tokens', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads tokens', () => {
    saveTokens('a', 'r', { id: '1', role: 'teacher', name: 'Ana', tenantId: 't1' })
    const loaded = loadTokens()
    expect(loaded.access).toBe('a')
    expect(loaded.refresh).toBe('r')
    expect(loaded.user?.name).toBe('Ana')
  })

  it('returns nulls when nothing stored', () => {
    const loaded = loadTokens()
    expect(loaded.access).toBeNull()
    expect(loaded.refresh).toBeNull()
    expect(loaded.user).toBeNull()
  })

  it('clearTokens removes all keys', () => {
    saveTokens('a', 'r', { id: '1', role: 'teacher', name: 'X', tenantId: 't' })
    clearTokens()
    const loaded = loadTokens()
    expect(loaded.access).toBeNull()
    expect(loaded.user).toBeNull()
  })
})
