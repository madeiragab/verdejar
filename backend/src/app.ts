import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config/env.js';
import './lib/zod-pt.js';
import { UPLOAD_DIR } from './lib/storage.js';
import { errorHandler, notFoundHandler } from './middlewares/error.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { catalogRoutes } from './modules/catalog/catalog.routes.js';
import { fileRoutes } from './modules/files/files.routes.js';
import { moderationRoutes } from './modules/moderation/moderation.routes.js';
import { newsRoutes } from './modules/news/news.routes.js';
import { plantRoutes } from './modules/plants/plants.routes.js';
import { regionRoutes } from './modules/regions/regions.routes.js';
import { userRoutes } from './modules/users/users.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // atrás do proxy do Render: IP correto no rate limit
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // O padrão do helmet (no-referrer) faz o OpenStreetMap bloquear os mapas: ele exige saber qual site pede os tiles.
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          // Fotos e notícias vêm de vários sites; mapas do OpenStreetMap; fontes do Google.
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com'],
          'connect-src': ["'self'"],
        },
      },
    }),
  );
  app.use(compression());
  app.use(cors({ origin: config.webOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use((req, _res, next) => {
    req.valid = {};
    next();
  });

  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));

  const api = express.Router();
  api.get('/health', (_req, res) => res.json({ ok: true }));
  api.use('/catalog', catalogRoutes);
  api.use('/auth', authRoutes);
  api.use('/plants', plantRoutes);
  api.use('/moderation', moderationRoutes);
  api.use('/regions', regionRoutes);
  api.use('/news', newsRoutes);
  api.use('/users', userRoutes);
  api.use('/files', fileRoutes);
  api.use(notFoundHandler);
  app.use('/api', api);

  // Produção num serviço só: a API também entrega o site (mesmo domínio → cookie de sessão sem bloqueio).
  const indexHtml = path.join(config.frontendDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(config.frontendDist, { index: false, maxAge: '1y', immutable: true }));
    app.get('*', (_req, res) => res.set('Cache-Control', 'no-cache').sendFile(indexHtml));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
