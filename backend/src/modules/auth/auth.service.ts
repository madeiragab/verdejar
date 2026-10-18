import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { config } from '../../config/env.js';
import { conflict, notFound, unauthorized } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/tokens.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

export const toPublicUser = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});

async function issueSession(user: User) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  const refreshToken = signRefreshToken(user.id);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + config.jwt.refreshDays * 86_400_000),
    },
  });
  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const email = input.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    throw conflict('Já existe uma conta com este e-mail');
  }
  const user = await prisma.user.create({
    data: { name: input.name, email, passwordHash: await bcrypt.hash(input.password, 10) },
  });
  return issueSession(user);
}

export async function login(input: LoginInput) {
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
    // Reuso de um token já rotacionado: possível roubo → derruba todas as sessões do usuário.
    await revokeAllSessions(userId);
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

export function revokeAllSessions(userId: string) {
  return prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('Usuário não encontrado');
  return toPublicUser(user);
}
