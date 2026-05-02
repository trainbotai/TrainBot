import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  assignmentIdParam,
  submitAssignmentSchema,
} from './assignments.schemas.js';
import * as ctrl from './assignments.controller.js';

// Teacher routes mounted at /api/v1/teacher
export const teacherAssignmentsRouter = Router();
teacherAssignmentsRouter.use(requireAuth, requireRole('teacher'));

teacherAssignmentsRouter.post(
  '/classes/:classId/assignments',
  validate(createAssignmentSchema),
  ctrl.teacherCreate,
);
teacherAssignmentsRouter.get(
  '/classes/:classId/assignments',
  ctrl.teacherListByClass,
);
teacherAssignmentsRouter.get(
  '/assignments/:id',
  validate(assignmentIdParam),
  ctrl.teacherGetDetail,
);
teacherAssignmentsRouter.patch(
  '/assignments/:id',
  validate(updateAssignmentSchema),
  ctrl.teacherUpdate,
);
teacherAssignmentsRouter.delete(
  '/assignments/:id',
  validate(assignmentIdParam),
  ctrl.teacherArchive,
);

// Student routes mounted at /api/v1/student
export const studentAssignmentsRouter = Router();
studentAssignmentsRouter.use(requireAuth, requireRole('student'));

studentAssignmentsRouter.get('/assignments', ctrl.studentList);
studentAssignmentsRouter.post(
  '/assignments/:id/submit',
  validate(submitAssignmentSchema),
  ctrl.studentSubmit,
);
