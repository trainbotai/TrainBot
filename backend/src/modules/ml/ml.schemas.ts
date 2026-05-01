import { z } from 'zod';

// Sync payload from iOS — full project state with labels, idempotent via clientId
export const syncProjectSchema = z.object({
  body: z.object({
    clientId: z.string().min(1).max(64),
    name: z.string().min(1).max(100),
    modelTrained: z.boolean().optional(),
    modelVersion: z.number().int().min(0).optional(),
    trainedAt: z.string().datetime().optional(),
    labels: z
      .array(
        z.object({
          clientId: z.string().min(1).max(64),
          name: z.string().min(1).max(100),
          imageCount: z.number().int().min(0),
        }),
      )
      .max(50)
      .default([]),
  }),
});

export const projectIdParam = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const teacherStudentParam = z.object({
  params: z.object({ studentId: z.string().min(1) }),
});

export type SyncProjectBody = z.infer<typeof syncProjectSchema>['body'];
