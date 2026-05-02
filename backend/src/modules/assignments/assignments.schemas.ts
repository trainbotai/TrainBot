import { z } from 'zod';

export const createAssignmentSchema = z.object({
  params: z.object({ classId: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    dueAt: z.string().datetime().optional(),
  }),
});

export const updateAssignmentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    dueAt: z.string().datetime().nullable().optional(),
  }),
});

export const assignmentIdParam = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const submitAssignmentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    mlProjectId: z.string().min(1).optional(),
    notes: z.string().max(1000).optional(),
  }),
});
