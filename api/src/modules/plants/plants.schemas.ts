import { z } from 'zod';
import { biomeKeys, lightKeys, toxicityKeys, UFS, waterKeys } from '../../lib/catalog.js';

/** Campos vindos de formulário chegam como string; vazio vira "não informado". */
const blank = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const text = (max: number) => z.preprocess(blank, z.string().trim().max(max).optional());
const coord = (min: number, max: number) => z.preprocess(blank, z.coerce.number().min(min).max(max).optional());
const bool = z.preprocess((v) => v === true || v === 'true' || v === 'on' || v === '1', z.boolean());

export const plantInput = z.object({
  scientificName: z.string().trim().min(3, 'Informe o nome científico').max(120),
  popularNames: z.string().trim().min(2, 'Informe pelo menos um nome popular').max(300),
  family: text(80),
  description: text(2000),
  biome: z.enum(biomeKeys, { errorMap: () => ({ message: 'Escolha o bioma' }) }),
  climate: text(200),
  light: z.enum(lightKeys, { errorMap: () => ({ message: 'Escolha a necessidade de luz' }) }),
  water: z.enum(waterKeys, { errorMap: () => ({ message: 'Escolha a necessidade de água' }) }),
  medicinalUse: text(2000),
  toxicityLevel: z.preprocess(blank, z.enum(toxicityKeys).default('DESCONHECIDA')),
  toxicityNotes: text(1000),
  curiosities: text(2000),
  photoCredit: text(200),
  state: z.enum(UFS, { errorMap: () => ({ message: 'Escolha o estado' }) }),
  municipality: z.string().trim().min(2, 'Informe o município').max(120),
  latitude: coord(-90, 90),
  longitude: coord(-180, 180),
  source: z.string().trim().min(3, 'Informe a fonte onde a espécie foi confirmada').max(500),
  sourceUrl: z.preprocess(blank, z.string().trim().url('Link da fonte inválido').max(500).optional()),
  showContributor: bool.default(false),
});

export type PlantInput = z.infer<typeof plantInput>;

const optionalEnum = <T extends [string, ...string[]]>(values: T) => z.preprocess(blank, z.enum(values).optional());

export const listQuery = z.object({
  q: text(100),
  state: z.preprocess((v) => (typeof v === 'string' ? v.toUpperCase() : v), optionalEnum([...UFS])),
  municipality: text(120),
  biome: optionalEnum(biomeKeys),
  light: optionalEnum(lightKeys),
  water: optionalEnum(waterKeys),
  toxicity: optionalEnum(toxicityKeys),
  lat: coord(-90, 90),
  lng: coord(-180, 180),
  radiusKm: z.preprocess(blank, z.coerce.number().positive().max(5000).optional()),
  sort: z.preprocess(blank, z.enum(['recent', 'distance', 'name']).default('recent')),
  page: z.preprocess(blank, z.coerce.number().int().min(1).default(1)),
  limit: z.preprocess(blank, z.coerce.number().int().min(1).max(100).default(12)),
});

export type ListQuery = z.infer<typeof listQuery>;

export const idParam = z.object({ id: z.string().min(1) });
