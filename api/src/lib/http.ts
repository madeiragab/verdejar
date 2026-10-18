import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Encaminha erros de handlers assíncronos para o middleware de erro (Express 4). */
export const handle =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
