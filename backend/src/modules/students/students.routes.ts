import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createStudentSchema,
  bulkCreateStudentsSchema,
  resetPasswordSchema,
  studentIdSchema,
} from './students.schemas.js';
import * as ctrl from './students.controller.js';

// Routes for creating students inside a class (mounted under /classes/:classId/students)
export const classStudentsRouter = Router({ mergeParams: true });
classStudentsRouter.use(requireAuth, requireRole('teacher'));
classStudentsRouter.post('/', validate(createStudentSchema), ctrl.createOne);
classStudentsRouter.post('/bulk', validate(bulkCreateStudentsSchema), ctrl.createBulk);

// Routes operating on a single student (mounted under /students)
export const studentsRouter = Router();
studentsRouter.use(requireAuth, requireRole('teacher'));
studentsRouter.post('/:id/reset-password', validate(resetPasswordSchema), ctrl.resetPassword);
studentsRouter.delete('/:id', validate(studentIdSchema), ctrl.deleteOne);
