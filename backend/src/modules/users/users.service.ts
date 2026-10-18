import type { Role } from '@prisma/client';
import { badRequest, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { revokeAllSessions } from '../auth/auth.service.js';

export async function list() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { records: true } } },
  });
  return users.map(({ _count, ...u }) => ({ ...u, plants: _count.records }));
}

export async function changeRole(id: string, role: Role, actorId: string) {
  if (id === actorId && role !== 'ADMIN') throw badRequest('Você não pode remover o seu próprio acesso de admin');
  const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw notFound('Usuário não encontrado');

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  // O papel vai dentro do access token: derruba as sessões para valer no próximo login.
  await revokeAllSessions(id);
  return user;
}
