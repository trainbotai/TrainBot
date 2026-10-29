import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { userOrIpKey } from '../../src/middleware/rateLimit.js';
import { signAccessToken } from '../../src/services/tokenService.js';

function req(authorization?: string): Request {
  return { headers: { authorization }, ip: '1.2.3.4' } as unknown as Request;
}

describe('userOrIpKey', () => {
  it('keys by sub for a valid access token', () => {
    const t = signAccessToken({ sub: 'u1', role: 'student', tenantId: 't' });
    expect(userOrIpKey(req(`Bearer ${t}`))).toBe('u:u1');
  });

  it('keeps an expired but correctly signed token in the user bucket', () => {
    const expired = jwt.sign(
      { sub: 'u2', role: 'student', tenantId: 't', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_ACCESS_SECRET as string,
      { issuer: 'trainbot', audience: 'trainbot-clients' },
    );
    expect(userOrIpKey(req(`Bearer ${expired}`))).toBe('u:u2');
  });

  it('falls back to IP for a forged (wrongly signed) token', () => {
    const forged = jwt.sign({ sub: 'victim' }, 'x'.repeat(40));
    expect(userOrIpKey(req(`Bearer ${forged}`))).toBe('ip:1.2.3.4');
  });

  it('falls back to IP for an unsigned alg=none token', () => {
    const none = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from('{"sub":"victim"}').toString('base64url')}.`;
    expect(userOrIpKey(req(`Bearer ${none}`))).toBe('ip:1.2.3.4');
  });

  it('falls back to IP for missing or malformed header', () => {
    expect(userOrIpKey(req())).toBe('ip:1.2.3.4');
    expect(userOrIpKey(req('Bearer garbage'))).toBe('ip:1.2.3.4');
  });
});
