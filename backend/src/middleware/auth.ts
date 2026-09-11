import { Request, Response, NextFunction } from 'express';
import {
  verifyFirebaseToken,
  isFirebaseInitialized,
  decodeUnverifiedJwt,
} from '../config/firebaseAdmin.js';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ ok: false, error: 'Missing Bearer token' });
      return;
    }

    if (isFirebaseInitialized()) {
      const decoded = await verifyFirebaseToken(token);
      req.user = { ...(decoded as Record<string, unknown>), uid: decoded.uid };
      return next();
    }

    // Dev bypass: only in non-production environments
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd && process.env.DEV_AUTH_BYPASS === '1') {
      const payload = decodeUnverifiedJwt(token);
      if (!payload?.['uid']) {
        res.status(401).json({ ok: false, error: 'Invalid token' });
        return;
      }
      req.user = { uid: payload['uid'] as string, ...payload };
      return next();
    }

    res.status(500).json({ ok: false, error: 'Auth not configured' });
  } catch {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
};

const REAUTH_MAX_AGE_SECONDS = 5 * 60;

/**
 * Admin allowlist check — a comma-separated ADMIN_EMAILS env var rather than
 * a DB role field, since this app's user model has no role/permission
 * concept yet and there's only ever a couple of admin accounts. Exported
 * standalone (not just as the requireAdminEmail middleware below) so
 * controllers can also expose `isAdmin` on user-profile responses for the
 * frontend to gate its own UI, without duplicating the parsing logic.
 */
export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (typeof email !== 'string' || !email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
};

/** Must run after requireAuth (needs req.user populated). */
export const requireAdminEmail = (req: Request, res: Response, next: NextFunction): void => {
  if (!isAdminEmail(req.user?.email)) {
    res.status(403).json({ ok: false, error: 'Forbidden' });
    return;
  }
  next();
};

/**
 * Gate for irreversible operations (account deletion): rejects unless the
 * caller's Firebase ID token was minted from an authentication within the
 * last few minutes, via the token's `auth_time` claim. This is the
 * server-side half of the client's re-auth prompt (Settings.tsx) — it stops
 * a stolen/replayed bearer token from performing the action even if it's
 * still otherwise valid, since a long-lived session token's `auth_time`
 * reflects the ORIGINAL sign-in, not when it was last refreshed.
 *
 * `auth_time` is only present on tokens Firebase Admin actually verified —
 * dev-bypass tokens (no Firebase project configured) don't carry it, so this
 * is a no-op there, matching the rest of the dev-bypass auth path.
 */
export const requireRecentAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authTime = req.user?.['auth_time'];
  if (typeof authTime === 'number') {
    const ageSeconds = Date.now() / 1000 - authTime;
    if (ageSeconds > REAUTH_MAX_AGE_SECONDS) {
      res.status(401).json({
        ok: false,
        error: 'reauth_required',
        message: 'Please re-authenticate to continue.',
      });
      return;
    }
  }
  next();
};
