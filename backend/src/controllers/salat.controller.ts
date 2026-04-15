import { Request, Response, NextFunction } from 'express';
import * as salatService from '../services/salat.service.js';
import { PrayerId, PrayerStatus, PrayerLocation } from '../models/SalatLog.js';

export const getLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const date = req.query['date'] as string | undefined;
    const log = await salatService.getOrCreateLog(req.user.uid, date);
    res.json({ ok: true, log });
  } catch (err) { next(err); }
};

export const updatePrayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prayer, status, date, location, tasbeeh } = req.body as {
      prayer: PrayerId;
      status: PrayerStatus;
      date?: string;
      location?: PrayerLocation;
      tasbeeh?: boolean;
    };
    const log = await salatService.updatePrayerStatus(
      req.user.uid, prayer, status, date, location, tasbeeh
    );
    res.json({ ok: true, log });
  } catch (err) { next(err); }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = Number(req.query['days'] ?? 30);
    const logs = await salatService.getSalatHistory(req.user.uid, days);
    res.json({ ok: true, logs });
  } catch (err) { next(err); }
};

export const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = Number(req.query['days'] ?? 30);
    const analytics = await salatService.getSalatAnalytics(req.user.uid, days);
    res.json({ ok: true, ...analytics });
  } catch (err) { next(err); }
};
