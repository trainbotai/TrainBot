import { describe, it, expect } from 'vitest'
import { resolveBaseUrl } from './config'

describe('resolveBaseUrl', () => {
  it('uses env value when set', () => {
    expect(resolveBaseUrl('https://api.x/api/v1', true)).toBe('https://api.x/api/v1')
  })
  it('falls back to localhost in dev', () => {
    expect(resolveBaseUrl(undefined, false)).toBe('http://localhost:3000/api/v1')
    expect(resolveBaseUrl('', false)).toBe('http://localhost:3000/api/v1')
  })
  it('throws on empty/unset in production', () => {
    expect(() => resolveBaseUrl('', true)).toThrow()
    expect(() => resolveBaseUrl(undefined, true)).toThrow()
  })
})
