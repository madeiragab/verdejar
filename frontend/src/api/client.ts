import type { Session } from './types';

/** Origem da API: vazia quando site e API estão no mesmo domínio (dev com proxy e produção no Render). */
export const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const BASE = API_ORIGIN + '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

// O access token fica só em memória (não em localStorage) — ver docs/05-fluxos.md.
let accessToken: string | null = null;
let onSessionChange: (s: Session | null) => void = () => {};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const subscribeSession = (fn: (s: Session | null) => void) => {
  onSessionChange = fn;
};

let refreshing: Promise<Session | null> | null = null;

/** Troca o cookie de refresh por um novo access token. Chamadas simultâneas compartilham a mesma requisição. */
export function refreshSession(): Promise<Session | null> {
  refreshing ??= fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (res) => {
      if (!res.ok) return null;
      return (await res.json()) as Session;
    })
    .catch(() => null)
    .then((session) => {
      setAccessToken(session?.accessToken ?? null);
      onSessionChange(session);
      return session;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface Options {
  method?: string;
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

export async function api<T>(path: string, opts: Options = {}, retried = false): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  const isForm = opts.body instanceof FormData;
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (opts.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    credentials: 'include',
    signal: opts.signal,
    body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
  });

  if (res.status === 401 && accessToken && !retried && !path.startsWith('/auth/')) {
    const session = await refreshSession();
    if (session) return api<T>(path, opts, true);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = data.error ?? {};
    throw new ApiError(res.status, e.code ?? 'ERROR', e.message ?? 'Algo deu errado', e.details);
  }
  return data as T;
}
