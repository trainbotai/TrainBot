import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createSessionSchema,
  createVersionSchema,
  sessionIdParam,
  queryBodySchema,
  queryHistorySchema,
  reportBodySchema,
  teacherAssignmentSessionsParam,
  markReportReviewedSchema,
} from './llm.schemas.js';
import * as ctrl from './llm.controller.js';

export const studentLlmRouter = Router();
studentLlmRouter.use(requireAuth, requireRole('student'));

studentLlmRouter.post('/sessions', validate(createSessionSchema), ctrl.createSession);
studentLlmRouter.get('/sessions', ctrl.listMySessions);
studentLlmRouter.get('/sessions/:id', validate(sessionIdParam), ctrl.getMySession);
studentLlmRouter.post(
  '/sessions/:id/versions',
  validate(createVersionSchema),
  ctrl.addVersion,
);
studentLlmRouter.delete('/sessions/:id', validate(sessionIdParam), ctrl.deleteSession);
studentLlmRouter.post('/sessions/:id/query', validate(queryBodySchema), ctrl.query);
studentLlmRouter.get(
  '/sessions/:id/queries',
  validate(queryHistorySchema),
  ctrl.listMyQueries,
);
studentLlmRouter.post('/sessions/:id/report', validate(reportBodySchema), ctrl.report);
studentLlmRouter.get('/quota', ctrl.getQuota);

export const teacherLlmRouter = Router();
teacherLlmRouter.use(requireAuth, requireRole('teacher'));

teacherLlmRouter.get(
  '/assignments/:id/sessions',
  validate(teacherAssignmentSessionsParam),
  ctrl.teacherAssignmentSessions,
);
teacherLlmRouter.get(
  '/sessions/:id',
  validate(sessionIdParam),
  ctrl.teacherSessionDetail,
);
teacherLlmRouter.get('/reports', ctrl.teacherReports);
teacherLlmRouter.patch(
  '/reports/:id',
  validate(markReportReviewedSchema),
  ctrl.teacherMarkReportReviewed,
);
