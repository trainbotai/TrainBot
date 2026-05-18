import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { syncProjectSchema, projectIdParam, teacherStudentParam } from './ml.schemas.js';
import * as ctrl from './ml.controller.js';

// Student-facing routes mounted at /api/v1/student/ml
export const studentMlRouter = Router();
studentMlRouter.use(requireAuth, requireRole('student'));

studentMlRouter.get('/projects', ctrl.listOwnProjects);
studentMlRouter.post('/projects', validate(syncProjectSchema), ctrl.syncProject);
studentMlRouter.delete('/projects/:id', validate(projectIdParam), ctrl.deleteOwnProject);

// Teacher-facing routes mounted at /api/v1/teacher
// (mounted separately because they share path namespace with classes/students)
export const teacherMlRouter = Router();
teacherMlRouter.use(requireAuth, requireRole('teacher'));

teacherMlRouter.get(
  '/students/:studentId/ml-projects',
  validate(teacherStudentParam),
  ctrl.teacherListStudentProjects,
);

teacherMlRouter.get(
  '/classes/:classId/ml-projects',
  ctrl.teacherListClassProjects,
);
