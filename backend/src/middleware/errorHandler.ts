import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  name: string;
  errors?: Record<string, { message: string }>;
  path?: string;
  value?: unknown;
}

export const globalErrorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const isProd = process.env.NODE_ENV === 'production';

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: 'Validation failed',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    res.status(400).json({
      ok: false,
      error: 'Validation failed',
      details: Object.values(err.errors).map((e) => ({ message: e.message })),
    });
    return;
  }

  // Mongoose cast errors (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({ ok: false, error: 'Invalid ID format' });
    return;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    res.status(409).json({ ok: false, error: 'Duplicate entry' });
    return;
  }

  // Default
  const statusCode = err.statusCode ?? 500;
  const message = isProd && statusCode === 500 ? 'Internal Server Error' : (err.message ?? 'Internal Server Error');

  if (!isProd) console.error(err);

  res.status(statusCode).json({ ok: false, error: message });
};
