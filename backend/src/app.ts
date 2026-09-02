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
import fastingRoutes from './routes/fasting.routes.js';
import quranRoutes from './routes/quran.routes.js';
import socialRoutes from './routes/social.routes.js';
import cycleRoutes from './routes/cycle.routes.js';
import { generalLimiter, authLimiter, zikrLimiter, aiLimiter } from './middleware/rateLimiter.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

// Vercel serves gzip and brotli compression automatically on all responses
// (including JSON) — no express middleware needed. Verified 2026-09-02:
//   curl -sI -H "Accept-Encoding: br" https://ihsan-web-app-main.vercel.app/api/health
//   → content-encoding: br
const app = express();

// Behind Render/Vercel's proxy: without this, express-rate-limit keys every
// request off the load balancer's IP — one heavy user rate-limits everyone.
app.set('trust proxy', 1);

// Core middleware — CSP configured explicitly to match SPA's runtime needs.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // script-src: self only; no inline scripts or eval in the API layer
        scriptSrc: ["'self'"],
        // connect-src covers Firebase Auth, the Quran audio API, and the AI provider
        connectSrc: [
          "'self'",
          'https://*.googleapis.com', // Firebase Auth + Firestore
          'https://*.firebase.com', // Firebase realtime
          'https://identitytoolkit.googleapis.com',
          'https://api.alquran.cloud', // Quran audio / text
          'https://api.groq.com', // AI companion (Groq)
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        // Tailwind's JIT emits inline style attributes — unsafe-inline is required
        styleSrc: ["'self'", "'unsafe-inline'"],
        // Prevent this app from being embedded as a frame (clickjacking guard)
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  })
);
// Profile photos now go to Firebase Storage (frontend uploads directly, PATCH
// receives only the short https URL). The backup IMPORT route is the heaviest
// payload — 1 MB comfortably covers a full account history.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const isProd = process.env.NODE_ENV === 'production';
app.use(morgan(isProd ? 'combined' : 'dev'));

// CORS — explicit allowlist.
//
// Matched origins:
//   1. Anything in FRONTEND_ORIGIN (comma-separated list, e.g. custom domain)
//   2. https://ihsan-web-app-main.vercel.app  (production deployment)
//   3. https://ihsan-web-app-main-<sha>-isttiiak.vercel.app   (deploy preview)
//   4. https://ihsan-web-app-main-git-<branch>-isttiiak.vercel.app  (branch preview)
//
// The `-isttiiak` suffix is Vercel's per-account slug — only the `isttiiak`
// account can generate URLs with that suffix, so this is safe against any
// attacker registering an `ihsan-web-app-main-*` project under their own account.
const rawOrigins = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
const allowedOrigins = String(rawOrigins)
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Matches only ihsan-web-app-main under the isttiiak Vercel account.
// Drops the old permissive regex that matched any project starting with the name.
const vercelPreviewRegex =
  /^https:\/\/ihsan-web-app-main(?:-(?:git-)?[a-z0-9][a-z0-9-]*-isttiiak)?\.vercel\.app$/i;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      const ok = allowedOrigins.includes(normalized) || vercelPreviewRegex.test(normalized);
      return callback(null, ok);
    },
    // Auth uses Bearer tokens, not cookies — credentials false is correct here.
    credentials: false,
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
app.use('/api/fasting', fastingRoutes);
app.use('/api/quran', quranRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/cycle', cycleRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: 'Not Found' });
});

// Global error handler — must be last middleware (4 params)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  globalErrorHandler(err, req, res, next);
});

export default app;
