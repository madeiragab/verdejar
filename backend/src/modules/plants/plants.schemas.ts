import { LightNeed, RecordStatus, ToxicityLevel, WaterNeed } from '@prisma/client';
import { z } from 'zod';

/** Campos vindos de formulário chegam como string; vazio vira "não informado". */
const blank = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const text = (max: number) => z.preprocess(blank, z.string().trim().max(max).optional());
const coord = (min: number, max: number) => z.preprocess(blank, z.coerce.number().min(min).max(max).optional());
const bool = z.preprocess((v) => v === true || v === 'true' || v === 'on' || v === '1', z.boolean());
const optionalEnum = <T extends Record<string, string>>(e: T) => z.preprocess(blank, z.nativeEnum(e).optional());

export const plantInput = z.object({
  scientificName: z
    .string({ required_error: 'Informe o nome científico' })
    .trim()
    .min(3, 'Informe o nome científico')
    .max(120)
    .regex(/^[A-Za-z×-]+(\s+[A-Za-z×.-]+)+$/, 'Use o formato “Gênero epíteto” (ex.: Handroanthus albus)'),
  popularNames: z.string({ required_error: 'Informe pelo menos um nome popular' }).trim().min(2, 'Informe pelo menos um nome popular').max(300),
  family: text(80),
  description: text(2000),
  biome: z.string({ required_error: 'Escolha o bioma' }).min(1, 'Escolha o bioma').max(20),
  climate: text(200),
  light: z.nativeEnum(LightNeed, { errorMap: () => ({ message: 'Escolha a necessidade de luz' }) }),
  water: z.nativeEnum(WaterNeed, { errorMap: () => ({ message: 'Escolha a necessidade de água' }) }),
  medicinalUse: text(2000),
  toxicityLevel: z.preprocess(blank, z.nativeEnum(ToxicityLevel).default('DESCONHECIDA')),
  toxicityNotes: text(1000),
  curiosities: text(2000),
  photoCredit: text(200),
  municipalityCode: z.preprocess(
    blank,
    z.coerce
      .number({ required_error: 'Escolha o município', invalid_type_error: 'Escolha o município' })
      .int()
      .min(1000000, 'Escolha o município')
      .max(9999999, 'Escolha o município'),
  ),
  latitude: coord(-90, 90),
  longitude: coord(-180, 180),
  source: z.string({ required_error: 'Informe a fonte onde a espécie foi confirmada' }).trim().min(3, 'Informe a fonte onde a espécie foi confirmada').max(500),
  sourceUrl: z.preprocess(blank, z.string().trim().url('Link da fonte inválido').max(500).optional()),
  showContributor: bool.default(false),
});

export type PlantInput = z.infer<typeof plantInput>;

export const listQuery = z.object({
  q: text(100),
  state: z.preprocess((v) => (typeof v === 'string' && v ? v.toUpperCase() : undefined), z.string().length(2).optional()),
  municipality: z.preprocess(blank, z.coerce.number().int().optional()),
  biome: text(20),
  light: optionalEnum(LightNeed),
  water: optionalEnum(WaterNeed),
  toxicity: optionalEnum(ToxicityLevel),
  lat: coord(-90, 90),
  lng: coord(-180, 180),
  radiusKm: z.preprocess(blank, z.coerce.number().positive().max(5000).optional()),
  sort: z.preprocess(blank, z.enum(['recent', 'distance', 'name']).default('recent')),
  page: z.preprocess(blank, z.coerce.number().int().min(1).default(1)),
  limit: z.preprocess(blank, z.coerce.number().int().min(1).max(100).default(12)),
});

export type ListQuery = z.infer<typeof listQuery>;

export const idParam = z.object({ id: z.string().uuid('Identificador inválido') });

export const statusQuery = z.object({ status: z.nativeEnum(RecordStatus).default('PENDING') });
