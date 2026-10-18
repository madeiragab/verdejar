import { Router } from 'express';
import { handle } from '../../lib/http.js';
import { authenticate, optionalAuth } from '../../middlewares/auth.js';
import { photoUpload } from '../../middlewares/upload.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './plants.controller.js';
import { idParam, listQuery, plantInput } from './plants.schemas.js';

export const plantRoutes = Router();

plantRoutes.get('/', optionalAuth, validate(listQuery, 'query'), handle(controller.list));
plantRoutes.get('/stats', handle(controller.stats));
plantRoutes.get('/mine', authenticate, handle(controller.mine));
plantRoutes.get('/:id', optionalAuth, validate(idParam, 'params'), handle(controller.getById));
plantRoutes.post('/', authenticate, photoUpload, validate(plantInput), handle(controller.create));
plantRoutes.put('/:id', authenticate, photoUpload, validate(idParam, 'params'), validate(plantInput), handle(controller.update));
plantRoutes.delete('/:id', authenticate, validate(idParam, 'params'), handle(controller.remove));
