import type { Request, Response } from 'express';
import { config } from '../../config/env.js';
import * as auth from './auth.service.js';

const COOKIE = 'vj_refresh';

const cookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  // Em produção front e API ficam em domínios diferentes → SameSite=None exige HTTPS.
  sameSite: config.cookieSecure ? ('none' as const) : ('lax' as const),
  path: '/api/auth',
};

const setRefreshCookie = (res: Response, token: string) =>
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: config.jwt.refreshDays * 86_400_000 });

const clearRefreshCookie = (res: Response) => res.clearCookie(COOKIE, cookieOptions);

export async function register(req: Request, res: Response) {
  const { refreshToken, ...session } = await auth.register(req.valid.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json(session);
}

export async function login(req: Request, res: Response) {
  const { refreshToken, ...session } = await auth.login(req.valid.body);
  setRefreshCookie(res, refreshToken);
  res.json(session);
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken, ...session } = await auth.refresh(req.cookies?.[COOKIE]);
    setRefreshCookie(res, refreshToken);
    res.json(session);
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
}

export async function logout(req: Request, res: Response) {
  await auth.logout(req.cookies?.[COOKIE]);
  clearRefreshCookie(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  res.json({ user: await auth.me(req.user!.sub) });
}
