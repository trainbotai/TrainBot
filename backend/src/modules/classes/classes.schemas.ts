import { z } from 'zod';

export const createClassSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  }),
});

export const updateClassSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  }),
});

export const classIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
