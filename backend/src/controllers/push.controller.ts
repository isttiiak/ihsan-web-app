import { Request, Response, NextFunction } from 'express';
import * as pushService from '../services/push.service.js';
import { IPushCategories } from '../models/PushSubscription.js';

export const getVapidPublicKeyHandler = (req: Request, res: Response): void => {
  res.json({ ok: true, publicKey: pushService.getVapidPublicKey() });
};

export const subscribeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!pushService.isPushConfigured()) {
      res.status(503).json({ ok: false, error: 'Push notifications are not configured' });
      return;
    }
    const { endpoint, keys, categories, timezoneOffset, location } = req.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      categories?: Partial<IPushCategories>;
      timezoneOffset?: number;
      location?: { lat: number; lng: number };
    };
    await pushService.subscribe(
      req.user.uid,
      { endpoint, keys, categories, timezoneOffset, location },
      req.get('User-Agent')
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const unsubscribeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { endpoint } = req.body as { endpoint: string };
    await pushService.unsubscribe(endpoint);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const getPreferencesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [categories, subscribed] = await Promise.all([
      pushService.getPreferences(req.user.uid),
      pushService.hasActiveSubscription(req.user.uid),
    ]);
    res.json({ ok: true, categories, subscribed });
  } catch (err) {
    next(err);
  }
};

export const updatePreferencesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { categories } = req.body as { categories: Partial<IPushCategories> };
    await pushService.updatePreferences(req.user.uid, categories);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Vercel Cron → GET /api/cron/push-check, authenticated via a shared secret
// (Vercel sends `Authorization: Bearer <CRON_SECRET>` for configured cron
// jobs) rather than requireAuth, since there's no user session here at all.
export const runPushCronHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
    if (!process.env.CRON_SECRET || authHeader !== expected) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }
    const result = await pushService.runDailyPushCheck();
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
};
