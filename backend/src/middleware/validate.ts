import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction): void => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    res.status(400).json({
      ok: false,
      error: 'Validation failed',
      details: (result.error as ZodError).errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Apply coerced/parsed values back to req
  const data = result.data as { body?: unknown; query?: unknown; params?: unknown };
  if (data.body) Object.assign(req.body, data.body);
  if (data.query) Object.assign(req.query, data.query);

  next();
};
