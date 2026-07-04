import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import {
  createBotSchema,
  updateBotSchema,
  botIdParam,
  studentBotQuerySchema,
} from './teacherBots.schemas.js';
import * as ctrl from './teacherBots.controller.js';

export const teacherBotsRouter = Router();
teacherBotsRouter.use(requireAuth, requireRole('teacher'));

teacherBotsRouter.post('/', validate(createBotSchema), ctrl.createBot);
teacherBotsRouter.get('/', ctrl.listBots);
teacherBotsRouter.get('/:id', validate(botIdParam), ctrl.getBot);
teacherBotsRouter.put('/:id', validate(updateBotSchema), ctrl.updateBot);
teacherBotsRouter.delete('/:id', validate(botIdParam), ctrl.deleteBot);

export const studentBotsRouter = Router();
studentBotsRouter.use(requireAuth, requireRole('student'));

studentBotsRouter.get('/teacher-bots', ctrl.listBotsForStudent);
studentBotsRouter.post(
  '/teacher-bots/:id/query',
  validate(studentBotQuerySchema),
  ctrl.queryBot,
);
