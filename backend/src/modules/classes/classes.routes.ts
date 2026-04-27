import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createClassSchema, updateClassSchema, classIdSchema } from './classes.schemas.js';
import * as ctrl from './classes.controller.js';

export const classesRouter = Router();

classesRouter.use(requireAuth, requireRole('teacher'));

classesRouter.get('/', ctrl.list);
classesRouter.post('/', validate(createClassSchema), ctrl.create);
classesRouter.get('/:id', validate(classIdSchema), ctrl.getOne);
classesRouter.patch('/:id', validate(updateClassSchema), ctrl.update);
classesRouter.delete('/:id', validate(classIdSchema), ctrl.archive);
