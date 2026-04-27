import { Router } from 'express';
import {
  teacherSignupSchema,
  teacherLoginSchema,
  studentLoginSchema,
  refreshSchema,
} from './auth.schemas.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/teacher/signup', validate(teacherSignupSchema), ctrl.signupTeacher);
authRouter.post('/teacher/login', validate(teacherLoginSchema), ctrl.loginTeacher);
authRouter.post('/student/login', validate(studentLoginSchema), ctrl.loginStudent);
authRouter.post('/refresh', validate(refreshSchema), ctrl.refresh);
authRouter.post('/logout', validate(refreshSchema), ctrl.logout);
