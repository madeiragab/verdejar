import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { forbidden, unauthorized } from '../lib/errors.js';
import { type AccessPayload, verifyAccessToken } from '../lib/tokens.js';
import type { Role } from '../lib/catalog.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessPayload;
    }
  }
}

const RANK: Record<Role, number> = { USER: 0, MODERATOR: 1, ADMIN: 2 };

function readToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined;
}

/** Exige um access token válido. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) return next(unauthorized());
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return next(unauthorized('Sessão expirada', 'TOKEN_EXPIRED'));
    next(unauthorized('Token inválido', 'INVALID_TOKEN'));
  }
}

/** Lê o usuário se houver token, mas não bloqueia visitantes. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      /* visitante */
    }
  }
  next();
}

/** Exige papel mínimo (USER < MODERATOR < ADMIN). Use depois de `authenticate`. */
export const requireRole = (min: Role) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(unauthorized());
  if (RANK[req.user.role] < RANK[min]) return next(forbidden());
  next();
};

export const isModerator = (user?: AccessPayload) => !!user && RANK[user.role] >= RANK.MODERATOR;
export const isAdmin = (user?: AccessPayload) => user?.role === 'ADMIN';
