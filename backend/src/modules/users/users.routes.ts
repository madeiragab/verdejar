import { Role } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { handle } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import * as users from './users.service.js';

export const userRoutes = Router();
userRoutes.use(authenticate, requireRole('ADMIN'));

userRoutes.get(
  '/',
  handle(async (_req, res) => {
    res.json({ items: await users.list() });
  }),
);

userRoutes.patch(
  '/:id/role',
  validate(z.object({ id: z.string().uuid() }), 'params'),
  validate(z.object({ role: z.nativeEnum(Role) })),
  handle(async (req, res) => {
    res.json(await users.changeRole(req.valid.params.id, req.valid.body.role, req.user!.sub));
  }),
);
