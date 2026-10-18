import { Router } from 'express';
import { z } from 'zod';
import { handle } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { refreshNews } from './news.service.js';
import { NEWS_SOURCES } from './sources.js';

export const newsRoutes = Router();

newsRoutes.get(
  '/',
  validate(
    z.object({
      limit: z.coerce.number().int().min(1).max(60).default(24),
      source: z.string().max(80).optional(),
    }),
    'query',
  ),
  handle(async (req, res) => {
    const { limit, source } = req.valid.query;
    const items = await prisma.newsItem.findMany({
      where: source ? { sourceName: source } : undefined,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
    res.json({ items });
  }),
);

newsRoutes.get('/sources', (_req, res) => {
  res.json({ items: NEWS_SOURCES.map(({ id, name, site }) => ({ id, name, site })) });
});

newsRoutes.post(
  '/refresh',
  authenticate,
  requireRole('MODERATOR'),
  handle(async (_req, res) => {
    res.json(await refreshNews());
  }),
);
