import { TtlCache } from '../../lib/cache.js';
import { badRequest, HttpError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { normalize } from '../../lib/text.js';

const IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades';
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'Verdejar/0.1 (https://github.com/madeiragab/verdejar)';
const DAY = 86_400_000;

export interface MunicipalityItem {
  code: number;
  name: string;
}
export interface Place {
  state: string | null;
  municipality: string | null;
  municipalityCode: number | null;
}

const municipalitiesCache = new TtlCache<MunicipalityItem[]>(DAY);
const locateCache = new TtlCache<Place>(7 * DAY, 5000);

async function fetchJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return (await res.json()) as T;
}

export function listStates() {
  return prisma.state.findMany({ orderBy: { name: 'asc' } });
}

/** Municípios oficiais da UF (IBGE, cache de 24 h). Se o IBGE cair, usa os que já estão no banco. */
export async function listMunicipalities(uf: string): Promise<MunicipalityItem[]> {
  try {
    return await municipalitiesCache.wrap(uf, async () => {
      const list = await fetchJson<{ id: number; nome: string }[]>(`${IBGE}/estados/${uf}/municipios?orderBy=nome`);
      return list.map((m) => ({ code: m.id, name: m.nome }));
    });
  } catch {
    const rows = await prisma.municipality.findMany({ where: { stateUf: uf }, orderBy: { name: 'asc' } });
    return rows.map((r) => ({ code: r.ibgeCode, name: r.name }));
  }
}

interface IbgeMunicipality {
  id: number;
  nome: string;
  microrregiao?: { mesorregiao?: { UF?: { sigla: string } } } | null;
  'regiao-imediata'?: { 'regiao-intermediaria'?: { UF?: { sigla: string } } } | null;
}

/**
 * Garante que o município existe na tabela `municipalities`, buscando no IBGE na primeira vez.
 * Assim o banco só guarda os municípios que realmente têm registros.
 */
export async function ensureMunicipality(code: number) {
  const existing = await prisma.municipality.findUnique({ where: { ibgeCode: code } });
  if (existing) return existing;

  let data: IbgeMunicipality;
  try {
    data = await fetchJson<IbgeMunicipality>(`${IBGE}/municipios/${code}`);
  } catch {
    throw new HttpError(502, 'IBGE_UNAVAILABLE', 'Não foi possível validar o município agora. Tente de novo.');
  }
  const uf = data?.microrregiao?.mesorregiao?.UF?.sigla ?? data?.['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla;
  if (!data?.id || !uf) throw badRequest('Município inválido', { municipalityCode: ['Município não encontrado'] });

  return prisma.municipality.upsert({
    where: { ibgeCode: data.id },
    update: {},
    create: { ibgeCode: data.id, name: data.nome, stateUf: uf },
  });
}

/** Coordenadas → estado e município (Nominatim + código IBGE). */
export async function locate(lat: number, lng: number): Promise<Place> {
  // Arredonda (~1 km) para aproveitar o cache e respeitar o limite de uso do Nominatim.
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  try {
    return await locateCache.wrap(key, async () => {
      const url = `${NOMINATIM}?format=jsonv2&zoom=10&addressdetails=1&accept-language=pt-BR&lat=${lat}&lon=${lng}`;
      const data = await fetchJson<{ address?: Record<string, string> }>(url, { 'User-Agent': USER_AGENT });
      const a = data.address ?? {};
      const name = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? null;

      // ISO3166-2-lvl4 vem como "BR-MG"; se faltar, procura pelo nome do estado.
      let state: string | null = a['ISO3166-2-lvl4']?.replace('BR-', '') ?? null;
      if (!state && a.state) {
        state = (await prisma.state.findFirst({ where: { name: a.state } }))?.uf ?? null;
      }

      let municipalityCode: number | null = null;
      if (state && name) {
        const list = await listMunicipalities(state).catch(() => []);
        municipalityCode = list.find((m) => normalize(m.name) === normalize(name))?.code ?? null;
      }
      return { state, municipality: name, municipalityCode };
    });
  } catch {
    throw new HttpError(502, 'GEOCODER_UNAVAILABLE', 'Não foi possível identificar o município agora');
  }
}
