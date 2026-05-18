import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/index.js';

export type Role = 'teacher' | 'student';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  tenantId: string;
}

export interface RefreshTokenPayload {
  sub: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: 'trainbot',
    audience: 'trainbot-clients',
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'trainbot',
    audience: 'trainbot-clients',
    jwtid: randomBytes(16).toString('hex'),
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'trainbot',
    audience: 'trainbot-clients',
  });
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'trainbot',
    audience: 'trainbot-clients',
  });
  return decoded as RefreshTokenPayload;
}
