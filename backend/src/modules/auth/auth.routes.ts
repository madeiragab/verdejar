import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handle } from '../../lib/http.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Muitas tentativas. Tente de novo em alguns minutos.' } },
});

export const authRoutes = Router();

authRoutes.post('/register', limiter, validate(registerSchema), handle(controller.register));
authRoutes.post('/login', limiter, validate(loginSchema), handle(controller.login));
authRoutes.post('/refresh', handle(controller.refresh));
authRoutes.post('/logout', handle(controller.logout));
authRoutes.get('/me', authenticate, handle(controller.me));
