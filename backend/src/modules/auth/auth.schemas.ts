import { z } from 'zod';

export const teacherSignupSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(8).max(100),
    name: z.string().min(1).max(100),
    tenantName: z.string().min(1).max(100),
    tenantSlug: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens'),
  }),
});

export const teacherLoginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
  }),
});

export const studentLoginSchema = z.object({
  body: z.object({
    classCode: z.string().min(4).max(20),
    username: z.string().min(1).max(50),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export type TeacherSignupBody = z.infer<typeof teacherSignupSchema>['body'];
export type TeacherLoginBody = z.infer<typeof teacherLoginSchema>['body'];
export type StudentLoginBody = z.infer<typeof studentLoginSchema>['body'];
export type RefreshBody = z.infer<typeof refreshSchema>['body'];
