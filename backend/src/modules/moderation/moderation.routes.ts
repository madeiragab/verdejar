import { Router } from 'express';
import { z } from 'zod';
import { handle } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { idParam, statusQuery } from '../plants/plants.schemas.js';
import * as moderation from './moderation.service.js';

const approveBody = z.object({ note: z.string().trim().max(1000).optional() });
const rejectBody = z.object({
  note: z
    .string({ required_error: 'Explique ao colaborador o que precisa ser corrigido' })
    .trim()
    .min(5, 'Explique ao colaborador o que precisa ser corrigido')
    .max(1000),
});

export const moderationRoutes = Router();
moderationRoutes.use(authenticate, requireRole('MODERATOR'));

moderationRoutes.get(
  '/plants',
  validate(statusQuery, 'query'),
  handle(async (req, res) => {
    res.json(await moderation.queue(req.valid.query.status, req.user!));
  }),
);

moderationRoutes.post(
  '/plants/:id/approve',
  validate(idParam, 'params'),
  validate(approveBody),
  handle(async (req, res) => {
    res.json(await moderation.decide(req.valid.params.id, 'APPROVED', req.user!, req.valid.body.note));
  }),
);

moderationRoutes.post(
  '/plants/:id/reject',
  validate(idParam, 'params'),
  validate(rejectBody),
  handle(async (req, res) => {
    res.json(await moderation.decide(req.valid.params.id, 'REJECTED', req.user!, req.valid.body.note));
  }),
);
