import rateLimit from 'express-rate-limit';

// In development all requests share localhost IP — disable rate limiting entirely
const isDev = process.env.NODE_ENV !== 'production';

const makeLimit = (windowMs: number, max: number, message: object) =>
  rateLimit({ windowMs, max: isDev ? 100_000 : max, standardHeaders: true, legacyHeaders: false, message });

/** Auth endpoints: brute-force guard — 30 per 15 min per IP */
export const authLimiter = makeLimit(
  15 * 60 * 1000,
  30,
  { ok: false, error: 'Too many requests, please try again later.' }
);

/** General API — 500 per 15 min per IP.
 *  React Query fires several queries on mount (summary, analytics, salat).
 *  100 was too low for normal multi-tab / focus-switching usage. */
export const generalLimiter = makeLimit(
  15 * 60 * 1000,
  500,
  { ok: false, error: 'Too many requests, please try again later.' }
);

/** Zikr increment: 300 per minute — allows fast tapping */
export const zikrLimiter = makeLimit(
  60 * 1000,
  300,
  { ok: false, error: 'Too many zikr requests.' }
);

/** AI suggestions: 10 per hour — expensive endpoint */
export const aiLimiter = makeLimit(
  60 * 60 * 1000,
  10,
  { ok: false, error: 'AI suggestion limit reached. Try again later.' }
);
