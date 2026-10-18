import { Router } from 'express';
import { z } from 'zod';
import { ROLES } from '../../lib/catalog.js';
import { badRequest, notFound } from '../../lib/errors.js';
import { handle } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';

export const userRoutes = Router();
userRoutes.use(authenticate, requireRole('ADMIN'));

userRoutes.get(
  '/',
  handle(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { plants: true } } },
    });
    res.json({
      items: users.map(({ _count, ...u }) => ({ ...u, plants: _count.plants })),
    });
  }),
);

userRoutes.patch(
  '/:id/role',
  validate(z.object({ id: z.string().min(1) }), 'params'),
  validate(z.object({ role: z.enum(ROLES) })),
  handle(async (req, res) => {
    const { id } = req.valid.params;
    const { role } = req.valid.body;
    if (id === req.user!.sub && role !== 'ADMIN') throw badRequest('Você não pode remover o seu próprio acesso de admin');
    const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw notFound('Usuário não encontrado');
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    // Sessões antigas carregam o papel antigo no token; derruba para forçar novo login.
    await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    res.json(user);
  }),
);
