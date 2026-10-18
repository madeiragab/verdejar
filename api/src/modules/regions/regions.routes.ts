import { Router } from 'express';
import { z } from 'zod';
import { TtlCache } from '../../lib/cache.js';
import { UFS } from '../../lib/catalog.js';
import { HttpError } from '../../lib/errors.js';
import { handle } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../middlewares/validate.js';

const IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades';
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'Verdejar/0.1 (https://github.com/verdejar)';

const DAY = 86_400_000;
const ibgeCache = new TtlCache<unknown>(DAY);
const locateCache = new TtlCache<{ state: string | null; municipality: string | null }>(7 * DAY, 5000);

interface IbgeState {
  id: number;
  sigla: string;
  nome: string;
  regiao: { nome: string };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return (await res.json()) as T;
}

/** Nominatim devolve "Minas Gerais"; convertemos para a sigla usando a lista do IBGE. */
async function statesBySigla() {
  const states = (await ibgeCache.wrap('states', () =>
    fetchJson<IbgeState[]>(`${IBGE}/estados?orderBy=nome`),
  )) as IbgeState[];
  return states;
}

export const regionRoutes = Router();

regionRoutes.get(
  '/states',
  handle(async (_req, res) => {
    try {
      const states = await statesBySigla();
      res.json({ items: states.map((s) => ({ uf: s.sigla, name: s.nome, region: s.regiao.nome })) });
    } catch {
      // IBGE fora do ar: devolve só as siglas para o front continuar funcionando.
      res.json({ items: UFS.map((uf) => ({ uf, name: uf, region: '' })) });
    }
  }),
);

regionRoutes.get(
  '/states/:uf/municipalities',
  validate(z.object({ uf: z.preprocess((v) => String(v).toUpperCase(), z.enum(UFS)) }), 'params'),
  handle(async (req, res) => {
    const { uf } = req.valid.params as { uf: string };
    try {
      const list = (await ibgeCache.wrap(`mun:${uf}`, () =>
        fetchJson<{ id: number; nome: string }[]>(`${IBGE}/estados/${uf}/municipios?orderBy=nome`),
      )) as { id: number; nome: string }[];
      res.json({ items: list.map((m) => ({ id: m.id, name: m.nome })) });
    } catch {
      // Fallback: municípios que já têm registros no banco.
      const rows = await prisma.plant.findMany({
        where: { state: uf, status: 'APPROVED' },
        distinct: ['municipality'],
        select: { municipality: true },
        orderBy: { municipality: 'asc' },
      });
      res.json({ items: rows.map((r, i) => ({ id: i, name: r.municipality })) });
    }
  }),
);

regionRoutes.get(
  '/locate',
  validate(z.object({ lat: z.coerce.number().min(-90).max(90), lng: z.coerce.number().min(-180).max(180) }), 'query'),
  handle(async (req, res) => {
    const { lat, lng } = req.valid.query as { lat: number; lng: number };
    // Arredonda (~1 km) para aproveitar o cache e respeitar o limite de uso do Nominatim.
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;

    try {
      const result = await locateCache.wrap(key, async () => {
        const url = `${NOMINATIM}?format=jsonv2&zoom=10&addressdetails=1&accept-language=pt-BR&lat=${lat}&lon=${lng}`;
        const data = await fetchJson<{ address?: Record<string, string> }>(url, {
          headers: { 'User-Agent': USER_AGENT },
        });
        const a = data.address ?? {};
        const municipality = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? null;
        // ISO3166-2-lvl4 vem como "BR-MG".
        let state: string | null = a['ISO3166-2-lvl4']?.replace('BR-', '') ?? null;
        if (!state && a.state) {
          const states = await statesBySigla().catch(() => []);
          state = states.find((s) => s.nome === a.state)?.sigla ?? null;
        }
        return { state, municipality };
      });
      res.json({ ...result, lat, lng });
    } catch {
      throw new HttpError(502, 'GEOCODER_UNAVAILABLE', 'Não foi possível identificar o município agora');
    }
  }),
);
