import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { syncProjectSchema, projectIdParam, teacherStudentParam } from './ml.schemas.js';
import * as ctrl from './ml.controller.js';
import * as imageCtrl from './image.controller.js';

// Student-facing routes mounted at /api/v1/student/ml
export const studentMlRouter = Router();
studentMlRouter.use(requireAuth, requireRole('student'));

studentMlRouter.get('/projects', ctrl.listOwnProjects);
studentMlRouter.post('/projects', validate(syncProjectSchema), ctrl.syncProject);
studentMlRouter.delete('/projects/:id', validate(projectIdParam), ctrl.deleteOwnProject);

studentMlRouter.post(
  '/projects/:projectId/labels/:labelId/images',
  imageCtrl.imageUploadMiddleware,
  imageCtrl.uploadImage,
);
studentMlRouter.delete('/images/:imageId', imageCtrl.deleteImage);

// Teacher-facing routes mounted at /api/v1/teacher
// (mounted separately because they share path namespace with classes/students)
export const teacherMlRouter = Router();
teacherMlRouter.use(requireAuth, requireRole('teacher'));

teacherMlRouter.get('/stats', ctrl.teacherStats);

teacherMlRouter.get(
  '/students/:studentId/ml-projects',
  validate(teacherStudentParam),
  ctrl.teacherListStudentProjects,
);

teacherMlRouter.get(
  '/classes/:classId/ml-projects',
  ctrl.teacherListClassProjects,
);

// Image serving — works for both student (own images) and teacher (their students)
// Mounted at /api/v1/ml/images/:imageId so both roles can hit it
export const sharedMlRouter = Router();
sharedMlRouter.use(requireAuth);
sharedMlRouter.get('/images/:imageId', imageCtrl.serveImage);
