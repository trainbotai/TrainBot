import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { createPilotRequestSchema } from './pilot.schemas.js';
import * as ctrl from './pilot.controller.js';

// Endpoint PUBLIC (fără auth) — formularul de pilot de pe site-ul de marketing.
// Protecții: rate limit dedicat (montat în app.ts), validare Zod, honeypot.
export const pilotRouter = Router();

pilotRouter.post('/', validate(createPilotRequestSchema), ctrl.create);
