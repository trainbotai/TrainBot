import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/services/tokenService.js';

describe('tokenService', () => {
  const payload = { sub: 'user-123', role: 'teacher' as const, tenantId: 'tenant-abc' };

  it('signAccessToken returns a non-empty string', () => {
    const token = signAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
  });

  it('verifyAccessToken returns the payload for a valid token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('user-123');
    expect(decoded.role).toBe('teacher');
    expect(decoded.tenantId).toBe('tenant-abc');
  });

  it('verifyAccessToken throws for an invalid token', () => {
    expect(() => verifyAccessToken('not-a-jwt')).toThrow();
  });

  it('signRefreshToken / verifyRefreshToken roundtrip works', () => {
    const token = signRefreshToken({ sub: 'user-456' });
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe('user-456');
  });

  it('access tokens use a different secret than refresh tokens', () => {
    const accessToken = signAccessToken(payload);
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });
});
