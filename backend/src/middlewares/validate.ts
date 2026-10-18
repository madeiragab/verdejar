import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

type Part = 'body' | 'query' | 'params';

/** Valida e normaliza uma parte da requisição. O resultado fica em `req.valid[part]`. */
export const validate =
  (schema: ZodSchema, part: Part = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) return next(result.error);
    req.valid = { ...req.valid, [part]: result.data };
    next();
  };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      valid: Partial<Record<Part, any>>;
    }
  }
}
