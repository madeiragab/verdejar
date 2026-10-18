import 'dotenv/config';
import path from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';

/** Em produção os segredos são obrigatórios; em desenvolvimento usa valores de exemplo. */
function secret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (isProduction) throw new Error(`Variável de ambiente obrigatória em produção: ${name}`);
  return devFallback;
}

// O Render informa a URL pública do serviço nesta variável.
const renderUrl = process.env.RENDER_EXTERNAL_URL;
const publicUrl = (process.env.PUBLIC_URL || renderUrl || 'http://localhost:3333').replace(/\/$/, '');

export const config = {
  isProduction,
  port: Number(process.env.PORT ?? 3333),
  webOrigin: (process.env.WEB_ORIGIN || renderUrl || 'http://localhost:5173').split(',').map((o) => o.trim()),
  publicUrl,
  jwt: {
    accessSecret: secret('JWT_ACCESS_SECRET', 'dev-access'),
    refreshSecret: secret('JWT_REFRESH_SECRET', 'dev-refresh'),
    accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
    refreshDays: Number(process.env.REFRESH_TOKEN_DAYS ?? 7),
  },
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  storageDriver: (process.env.STORAGE_DRIVER === 'disk' ? 'disk' : 'database') as 'disk' | 'database',
  cloudinaryUrl: process.env.CLOUDINARY_URL || undefined,
  newsRefreshMinutes: Number(process.env.NEWS_REFRESH_MINUTES ?? 60),
  /** Build do frontend. Se existir, a API também serve o site (deploy num serviço só). */
  frontendDist: path.resolve(process.env.FRONTEND_DIST ?? '../frontend/dist'),
};
