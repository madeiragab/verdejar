import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { HttpError } from '../lib/errors.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada' } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', details: err.flatten().fieldErrors },
    });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'A foto deve ter no máximo 5 MB' : err.message;
    return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Erro interno do servidor' } });
}
