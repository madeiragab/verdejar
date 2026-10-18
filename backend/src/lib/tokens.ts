import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import type { Role } from '@prisma/client';

export interface AccessPayload {
  sub: string;
  role: Role;
  name: string;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtl as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, config.jwt.accessSecret) as AccessPayload;
}

/** Refresh token: JWT com segredo próprio; no banco guardamos só o hash. */
export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, jti: crypto.randomUUID() }, config.jwt.refreshSecret, {
    expiresIn: `${config.jwt.refreshDays}d`,
  });
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, config.jwt.refreshSecret) as { sub: string };
}

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
