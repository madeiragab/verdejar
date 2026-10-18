import { Router } from 'express';
import { handle } from '../../lib/http.js';
import { authenticate, optionalAuth } from '../../middlewares/auth.js';
import { photoUpload } from '../../middlewares/upload.js';
import { validate } from '../../middlewares/validate.js';
import { idParam, listQuery, plantInput } from './plants.schemas.js';
import * as plants from './plants.service.js';

export const plantRoutes = Router();

plantRoutes.get(
  '/',
  optionalAuth,
  validate(listQuery, 'query'),
  handle(async (req, res) => {
    res.json(await plants.list(req.valid.query, req.user));
  }),
);

plantRoutes.get(
  '/stats',
  handle(async (_req, res) => {
    res.json(await plants.stats());
  }),
);

plantRoutes.get(
  '/mine',
  authenticate,
  handle(async (req, res) => {
    res.json({ items: await plants.mine(req.user!) });
  }),
);

plantRoutes.get(
  '/:id',
  optionalAuth,
  validate(idParam, 'params'),
  handle(async (req, res) => {
    res.json(await plants.getById(req.valid.params.id, req.user));
  }),
);

plantRoutes.post(
  '/',
  authenticate,
  photoUpload,
  validate(plantInput),
  handle(async (req, res) => {
    res.status(201).json(await plants.create(req.valid.body, req.file, req.user!));
  }),
);

plantRoutes.put(
  '/:id',
  authenticate,
  photoUpload,
  validate(idParam, 'params'),
  validate(plantInput),
  handle(async (req, res) => {
    res.json(await plants.update(req.valid.params.id, req.valid.body, req.file, req.user!));
  }),
);

plantRoutes.delete(
  '/:id',
  authenticate,
  validate(idParam, 'params'),
  handle(async (req, res) => {
    await plants.remove(req.valid.params.id, req.user!);
    res.status(204).end();
  }),
);
