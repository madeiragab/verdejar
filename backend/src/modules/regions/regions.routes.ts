import { Router } from 'express';
import { z } from 'zod';
import { handle } from '../../lib/http.js';
import { validate } from '../../middlewares/validate.js';
import * as regions from './regions.service.js';

const ufParam = z.object({ uf: z.string().regex(/^[a-zA-Z]{2}$/, 'UF inválida').transform((v) => v.toUpperCase()) });
const coordsQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const regionRoutes = Router();

regionRoutes.get(
  '/states',
  handle(async (_req, res) => {
    const states = await regions.listStates();
    res.json({ items: states.map((s) => ({ uf: s.uf, name: s.name, region: s.region })) });
  }),
);

regionRoutes.get(
  '/states/:uf/municipalities',
  validate(ufParam, 'params'),
  handle(async (req, res) => {
    res.json({ items: await regions.listMunicipalities(req.valid.params.uf) });
  }),
);

regionRoutes.get(
  '/locate',
  validate(coordsQuery, 'query'),
  handle(async (req, res) => {
    const { lat, lng } = req.valid.query;
    res.json({ ...(await regions.locate(lat, lng)), lat, lng });
  }),
);
