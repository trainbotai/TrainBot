import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/tokenService.js';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';

export interface AuthContext {
  userId: string;
  role: 'teacher' | 'student';
  tenantId: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or invalid Authorization header'));
    return;
  }
  const token = header.substring(7);
  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      tenantId: payload.tenantId,
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
}

export function requireRole(...roles: ('teacher' | 'student')[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(new ForbiddenError(`This endpoint requires role: ${roles.join(' or ')}`));
      return;
    }
    next();
  };
}
