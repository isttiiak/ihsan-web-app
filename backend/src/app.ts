import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import zikrRoutes from './routes/zikr.routes.js';
import aiRoutes from './routes/ai.routes.js';
import userRoutes from './routes/user.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import salatRoutes from './routes/salat.routes.js';
import { generalLimiter, authLimiter, zikrLimiter, aiLimiter } from './middleware/rateLimiter.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

const app = express();

// Core middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProd = process.env.NODE_ENV === 'production';
app.use(morgan(isProd ? 'combined' : 'dev'));

// CORS
const rawOrigins = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
const allowedOrigins = String(rawOrigins)
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
const vercelPreviewRegex = /^https?:\/\/ihsan-web-app-main.*\.vercel\.app$/i;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      const ok = allowedOrigins.includes(normalized) || vercelPreviewRegex.test(normalized);
      return callback(null, ok);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);

// Apply general rate limiter globally
app.use(generalLimiter);

// Health check (no auth, no rate limit beyond general)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, message: 'Ihsan API is healthy' });
});

// Routes with per-route rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/zikr', zikrLimiter, zikrRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/salat', salatRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: 'Not Found' });
});

// Global error handler — must be last middleware (4 params)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  globalErrorHandler(err, req, res, next);
});

export default app;
