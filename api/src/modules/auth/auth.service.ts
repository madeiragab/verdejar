import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { config } from '../../config.js';
import { conflict, unauthorized } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import type { Role } from '../../lib/catalog.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/tokens.js';

export const publicUser = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role as Role,
  createdAt: u.createdAt,
});

async function issueSession(user: User) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role as Role, name: user.name });
  const refreshToken = signRefreshToken(user.id);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + config.jwt.refreshDays * 86_400_000),
    },
  });
  return { user: publicUser(user), accessToken, refreshToken };
}

export async function register(input: { name: string; email: string; password: string }) {
  const email = input.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    throw conflict('Já existe uma conta com este e-mail');
  }
  const user = await prisma.user.create({
    data: { name: input.name, email, passwordHash: await bcrypt.hash(input.password, 10) },
  });
  return issueSession(user);
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw unauthorized('E-mail ou senha incorretos', 'INVALID_CREDENTIALS');
  }
  return issueSession(user);
}

/** Troca um refresh token válido por uma nova sessão (rotação). */
export async function refresh(token: string | undefined) {
  if (!token) throw unauthorized('Sessão não encontrada', 'NO_SESSION');

  let userId: string;
  try {
    userId = verifyRefreshToken(token).sub;
  } catch {
    throw unauthorized('Sessão expirada', 'NO_SESSION');
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!stored || stored.userId !== userId || stored.expiresAt < new Date()) {
    throw unauthorized('Sessão expirada', 'NO_SESSION');
  }
  if (stored.revokedAt) {
    // Reuso de token já rotacionado: possível roubo → derruba todas as sessões do usuário.
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    throw unauthorized('Sessão inválida', 'NO_SESSION');
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  return issueSession(stored.user);
}

export async function logout(token: string | undefined) {
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
