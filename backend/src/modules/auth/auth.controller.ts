import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';

export async function signupTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.signupTeacher(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function loginTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.loginTeacher(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function loginStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.loginStudent(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.refreshTokens(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.body.refreshToken);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
