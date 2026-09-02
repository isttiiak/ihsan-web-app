import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

// In development all requests share localhost IP — disable rate limiting entirely
const isDev = process.env.NODE_ENV !== 'production';

const makeLimit = (windowMs: number, max: number, message: object) =>
  rateLimit({
    windowMs,
    max: isDev ? 100_000 : max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
  });

/** Auth endpoints: brute-force guard — 30 per 15 min per IP */
export const authLimiter = makeLimit(15 * 60 * 1000, 30, {
  ok: false,
  error: 'Too many requests, please try again later.',
});

/** General API — 500 per 15 min per IP.
 *  React Query fires several queries on mount (summary, analytics, salat).
 *  100 was too low for normal multi-tab / focus-switching usage. */
export const generalLimiter = makeLimit(15 * 60 * 1000, 500, {
  ok: false,
  error: 'Too many requests, please try again later.',
});

/** Zikr increment: 300 per minute — allows fast tapping */
export const zikrLimiter = makeLimit(60 * 1000, 300, {
  ok: false,
  error: 'Too many zikr requests.',
});

/** AI suggestions: 10 per hour — expensive endpoint */
export const aiLimiter = makeLimit(60 * 60 * 1000, 10, {
  ok: false,
  error: 'AI suggestion limit reached. Try again later.',
});

// ── Per-UID limiters (applied AFTER requireAuth so req.user.uid is set) ──────
// Keying off UID rather than IP prevents a single user from exhausting the
// limit by rotating IPs, and prevents one IP (NAT/proxy) from blocking others.

const makeUidLimit = (windowMs: number, max: number, message: object) =>
  rateLimit({
    windowMs,
    max: isDev ? 100_000 : max,
    keyGenerator: (req: Request) => req.user?.uid ?? req.ip ?? 'unknown',
    // Suppress the IP-fallback validation warning — the IP path is only reached
    // if requireAuth somehow fails before this middleware, which would 401 first.
    validate: { keyGeneratorIpFallback: false },
    standardHeaders: true,
    legacyHeaders: false,
    message,
  });

/** Friend-connect: 10 per hour per UID — prevents invite-code spam */
export const socialConnectLimiter = makeUidLimit(60 * 60 * 1000, 10, {
  ok: false,
  error: 'Too many connection attempts. Try again in an hour.',
});

/** Account import: 10 per hour per UID — prevents backup-flood abuse */
export const importLimiter = makeUidLimit(60 * 60 * 1000, 10, {
  ok: false,
  error: 'Too many import attempts. Try again in an hour.',
});
