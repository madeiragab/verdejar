import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import './lib/zod-pt.js';
import { BIOMES, LIGHT, TOXICITY, WATER } from './lib/catalog.js';
import { UPLOAD_DIR } from './lib/storage.js';
import { errorHandler, notFoundHandler } from './middlewares/error.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { moderationRoutes } from './modules/moderation/moderation.routes.js';
import { newsRoutes } from './modules/news/news.routes.js';
import { plantRoutes } from './modules/plants/plants.routes.js';
import { regionRoutes } from './modules/regions/regions.routes.js';
import { userRoutes } from './modules/users/users.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // Render/Vercel ficam atrás de proxy (IP correto no rate limit)
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
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
  api.get('/catalog', (_req, res) => res.json({ biomes: BIOMES, light: LIGHT, water: WATER, toxicity: TOXICITY }));
  api.use('/auth', authRoutes);
  api.use('/plants', plantRoutes);
  api.use('/moderation', moderationRoutes);
  api.use('/regions', regionRoutes);
  api.use('/news', newsRoutes);
  api.use('/users', userRoutes);
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
