import { Router, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../../config.js';
import { notFound } from '../../lib/errors.js';
import { handle } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import * as auth from './auth.service.js';

const COOKIE = 'vj_refresh';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').max(80),
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres').max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

const cookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  // Em produção front e API ficam em domínios diferentes → SameSite=None exige HTTPS.
  sameSite: config.cookieSecure ? ('none' as const) : ('lax' as const),
  path: '/api/auth',
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: config.jwt.refreshDays * 86_400_000 });
}

const clearRefreshCookie = (res: Response) => res.clearCookie(COOKIE, cookieOptions);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Muitas tentativas. Tente de novo em alguns minutos.' } },
});

export const authRoutes = Router();

authRoutes.post(
  '/register',
  limiter,
  validate(registerSchema),
  handle(async (req, res) => {
    const { refreshToken, ...session } = await auth.register(req.valid.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json(session);
  }),
);

authRoutes.post(
  '/login',
  limiter,
  validate(loginSchema),
  handle(async (req, res) => {
    const { refreshToken, ...session } = await auth.login(req.valid.body);
    setRefreshCookie(res, refreshToken);
    res.json(session);
  }),
);

authRoutes.post(
  '/refresh',
  handle(async (req, res) => {
    try {
      const { refreshToken, ...session } = await auth.refresh(req.cookies?.[COOKIE]);
      setRefreshCookie(res, refreshToken);
      res.json(session);
    } catch (err) {
      clearRefreshCookie(res);
      throw err;
    }
  }),
);

authRoutes.post(
  '/logout',
  handle(async (req, res) => {
    await auth.logout(req.cookies?.[COOKIE]);
    clearRefreshCookie(res);
    res.status(204).end();
  }),
);

authRoutes.get(
  '/me',
  authenticate,
  handle(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw notFound('Usuário não encontrado');
    res.json({ user: auth.publicUser(user) });
  }),
);
