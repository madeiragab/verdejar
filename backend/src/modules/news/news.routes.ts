import { Router } from 'express';
import { z } from 'zod';
import { handle } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { refreshNews } from './news.service.js';

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(60).default(24),
  source: z.string().max(40).optional(),
});

export const newsRoutes = Router();

newsRoutes.get(
  '/',
  validate(listQuery, 'query'),
  handle(async (req, res) => {
    const { limit, source } = req.valid.query;
    const items = await prisma.newsItem.findMany({
      where: source ? { sourceId: source } : undefined,
      include: { source: { select: { name: true } } },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
    res.json({
      items: items.map(({ source: s, ...n }) => ({ ...n, sourceName: s.name })),
    });
  }),
);

newsRoutes.get(
  '/sources',
  handle(async (_req, res) => {
    const sources = await prisma.newsSource.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    res.json({ items: sources.map((s) => ({ id: s.id, name: s.name, site: s.siteUrl })) });
  }),
);

newsRoutes.post(
  '/refresh',
  authenticate,
  requireRole('MODERATOR'),
  handle(async (_req, res) => {
    res.json(await refreshNews());
  }),
);
