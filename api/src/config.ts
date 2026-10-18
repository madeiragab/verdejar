import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3333),
  webOrigin: (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
  publicUrl: (process.env.PUBLIC_URL ?? 'http://localhost:3333').replace(/\/$/, ''),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh'),
    accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
    refreshDays: Number(process.env.REFRESH_TOKEN_DAYS ?? 7),
  },
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cloudinaryUrl: process.env.CLOUDINARY_URL || undefined,
  newsRefreshMinutes: Number(process.env.NEWS_REFRESH_MINUTES ?? 60),
};
