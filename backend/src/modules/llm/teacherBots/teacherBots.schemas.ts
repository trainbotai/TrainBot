import { z } from 'zod';

const botExampleSchema = z.object({
  input: z.string().min(1).max(500),
  output: z.string().min(1).max(500),
});

const botBodySchema = z.object({
  name: z.string().min(1).max(100),
  instruction: z.string().min(1).max(2000),
  examples: z.array(botExampleSchema).min(1).max(10),
  classId: z.string().cuid().optional(),
});

export const createBotSchema = z.object({
  body: botBodySchema,
});

export const updateBotSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: botBodySchema.partial(),
});

export const botIdParam = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const studentBotQuerySchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    prompt: z.string().min(1).max(1000),
  }),
});
