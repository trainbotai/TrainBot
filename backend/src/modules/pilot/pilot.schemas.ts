import { z } from 'zod';

export const createPilotRequestSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    school: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(200),
    message: z.string().trim().max(2000).optional(),
    locale: z.enum(['ro', 'en']).optional(),
    // honeypot anti-spam: câmp invizibil în formular, boții îl completează
    website: z.string().max(500).optional(),
  }),
});
