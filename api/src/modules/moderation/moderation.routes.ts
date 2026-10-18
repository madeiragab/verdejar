import { Router } from 'express';
import { z } from 'zod';
import { STATUS } from '../../lib/catalog.js';
import { notFound } from '../../lib/errors.js';
import { handle } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { serialize } from '../plants/plants.service.js';

const people = {
  contributor: { select: { id: true, name: true } },
  reviewedBy: { select: { id: true, name: true } },
};

const queueQuery = z.object({ status: z.enum(STATUS).default('PENDING') });
const idParam = z.object({ id: z.string().min(1) });
const approveBody = z.object({ note: z.string().trim().max(1000).optional() });
const rejectBody = z.object({
  note: z.string().trim().min(5, 'Explique ao colaborador o que precisa ser corrigido').max(1000),
});

export const moderationRoutes = Router();
moderationRoutes.use(authenticate, requireRole('MODERATOR'));

moderationRoutes.get(
  '/plants',
  validate(queueQuery, 'query'),
  handle(async (req, res) => {
    const { status } = req.valid.query;
    const [rows, counts] = await Promise.all([
      prisma.plant.findMany({
        where: { status },
        include: people,
        // Pendentes: mais antigos primeiro (fila). Demais: mais recentes primeiro.
        orderBy: { updatedAt: status === 'PENDING' ? 'asc' : 'desc' },
        take: 100,
      }),
      prisma.plant.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    res.json({
      items: rows.map((p) => serialize(p, req.user)),
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    });
  }),
);

async function review(id: string, reviewerId: string, status: 'APPROVED' | 'REJECTED', note?: string) {
  const exists = await prisma.plant.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw notFound('Planta não encontrada');
  return prisma.plant.update({
    where: { id },
    data: { status, reviewNote: note || null, reviewedById: reviewerId, reviewedAt: new Date() },
    include: people,
  });
}

moderationRoutes.post(
  '/plants/:id/approve',
  validate(idParam, 'params'),
  validate(approveBody),
  handle(async (req, res) => {
    const plant = await review(req.valid.params.id, req.user!.sub, 'APPROVED', req.valid.body.note);
    res.json(serialize(plant, req.user));
  }),
);

moderationRoutes.post(
  '/plants/:id/reject',
  validate(idParam, 'params'),
  validate(rejectBody),
  handle(async (req, res) => {
    const plant = await review(req.valid.params.id, req.user!.sub, 'REJECTED', req.valid.body.note);
    res.json(serialize(plant, req.user));
  }),
);
