import { Router } from 'express';
import { z } from 'zod';
import { notFound } from '../../lib/errors.js';
import { handle } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../middlewares/validate.js';

export const fileRoutes = Router();

/** Entrega uma foto guardada no banco. O conteúdo nunca muda, então pode ficar em cache por 1 ano. */
fileRoutes.get(
  '/:id',
  validate(z.object({ id: z.string().uuid() }), 'params'),
  handle(async (req, res) => {
    const file = await prisma.storedFile.findUnique({ where: { id: req.valid.params.id } });
    if (!file) throw notFound('Arquivo não encontrado');
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.end(Buffer.from(file.data));
  }),
);
