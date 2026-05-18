import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export function validate<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      next(result.error);
      return;
    }
    if ('body' in result.data) (req as { body: unknown }).body = (result.data as { body: unknown }).body;
    if ('query' in result.data) (req as { query: unknown }).query = (result.data as { query: unknown }).query;
    if ('params' in result.data) (req as { params: unknown }).params = (result.data as { params: unknown }).params;
    next();
  };
}
