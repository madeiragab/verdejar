import { Router } from 'express';
import { handle } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { LIGHT_LABELS, TOXICITY_LABELS, WATER_LABELS } from './catalog.labels.js';

export const catalogRoutes = Router();

/** Opções dos formulários e filtros, com rótulos em português. */
catalogRoutes.get(
  '/',
  handle(async (_req, res) => {
    const biomes = await prisma.biome.findMany({ orderBy: { name: 'asc' } });
    res.json({
      biomes: Object.fromEntries(biomes.map((b) => [b.code, b.name])),
      light: LIGHT_LABELS,
      water: WATER_LABELS,
      toxicity: TOXICITY_LABELS,
    });
  }),
);
