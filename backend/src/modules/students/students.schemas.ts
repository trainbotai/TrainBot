import { z } from 'zod';

export const createStudentSchema = z.object({
  params: z.object({ classId: z.string().min(1) }),
  body: z.object({
    username: z
      .string()
      .min(2)
      .max(30)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Letters, digits, dots, hyphens, underscores only'),
    password: z.string().min(6).max(50),
    displayName: z.string().min(1).max(50).optional(),
  }),
});

export const bulkCreateStudentsSchema = z.object({
  params: z.object({ classId: z.string().min(1) }),
  body: z.object({
    students: z
      .array(
        z.object({
          username: z.string().min(2).max(30),
          password: z.string().min(6).max(50),
          displayName: z.string().min(1).max(50).optional(),
        }),
      )
      .min(1)
      .max(100),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    newPassword: z.string().min(6).max(50),
  }),
});

export const studentIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
