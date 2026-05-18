import { z } from 'zod';
import { env } from '../../config/index.js';

const exampleSchema = z.object({
  user: z.string().min(1).max(env.LLM_MAX_EXAMPLE_LENGTH),
  ai: z.string().min(1).max(env.LLM_MAX_EXAMPLE_LENGTH),
});

export const createSessionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80),
    assignmentId: z.string().cuid().optional(),
    examples: z.array(exampleSchema).min(0).max(env.LLM_MAX_EXAMPLES_PER_VERSION),
  }),
});

export const createVersionSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    examples: z.array(exampleSchema).min(0).max(env.LLM_MAX_EXAMPLES_PER_VERSION),
  }),
});

export const sessionIdParam = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const queryBodySchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    prompt: z.string().min(1).max(1000),
  }),
});

export const queryHistorySchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  query: z.object({
    version: z.coerce.number().int().positive().optional(),
  }),
});

export const reportBodySchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

export const teacherAssignmentSessionsParam = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const markReportReviewedSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    reviewed: z.boolean(),
  }),
});
