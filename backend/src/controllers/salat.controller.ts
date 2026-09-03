import { Request, Response, NextFunction } from 'express';
import * as salatService from '../services/salat.service.js';
import * as salatDebtService from '../services/salatDebt.service.js';
import { PrayerId, PrayerStatus, PrayerLocation, NaflType } from '../models/SalatLog.js';

export const getLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const date = req.query['date'] as string | undefined;
    const log = await salatService.getLogReadOnly(req.user.uid, date);
    res.json({ ok: true, log });
  } catch (err) {
    next(err);
  }
};

export const updatePrayer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prayer, status, date, location, tasbeeh, ayatulKursi } = req.body as {
      prayer: PrayerId;
      status: PrayerStatus;
      date?: string;
      location?: PrayerLocation;
      tasbeeh?: boolean;
      ayatulKursi?: boolean;
    };
    const log = await salatService.updatePrayerStatus(
      req.user.uid,
      prayer,
      status,
      date,
      location,
      tasbeeh,
      ayatulKursi
    );
    res.json({ ok: true, log });
  } catch (err) {
    next(err);
  }
};

export const updateNafl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { completed, types, rakat, date } = req.body as {
      completed: boolean;
      types: NaflType[];
      rakat: number;
      date?: string;
    };
    const log = await salatService.updateNafl(req.user.uid, completed, types, rakat, date);
    res.json({ ok: true, log });
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = Number(req.query['days'] ?? 30);
    const logs = await salatService.getSalatHistory(req.user.uid, days);
    res.json({ ok: true, logs });
  } catch (err) {
    next(err);
  }
};

export const getAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = Number(req.query['days'] ?? 30);
    const today = req.query['today'] as string | undefined;
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ uid: req.user.uid }).select('salatResetDate').lean();
    const analytics = await salatService.getSalatAnalytics(
      req.user.uid,
      days,
      today,
      user?.salatResetDate
    );
    res.json({ ok: true, ...analytics });
  } catch (err) {
    next(err);
  }
};

export const resetSalat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const today = req.body?.today as string | undefined;
    const note = (req.body?.note as string | undefined) ?? '';
    const resetDate = today ?? salatService.todayDateString();
    const User = (await import('../models/User.js')).default;
    await User.updateOne(
      { uid: req.user.uid },
      {
        $set: { salatResetDate: resetDate },
        $push: { salatResetHistory: { date: resetDate, note, resetAt: new Date() } },
      }
    );
    res.json({ ok: true, resetDate });
  } catch (err) {
    next(err);
  }
};

export const getJourney = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const today = (req.query['today'] as string | undefined) ?? salatService.todayDateString();
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ uid: req.user.uid })
      .select('createdAt salatResetHistory')
      .lean();
    if (!user) {
      res.status(404).json({ ok: false, error: 'User not found' });
      return;
    }
    const phases = await salatService.getSalatJourney(
      req.user.uid,
      user.createdAt,
      (user.salatResetHistory ?? []).map((e) => ({ date: e.date, note: e.note ?? '' })),
      today
    );
    res.json({ ok: true, phases });
  } catch (err) {
    next(err);
  }
};

export const getDebt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const debt = await salatDebtService.getDebtReadOnly(req.user.uid);
    res.json({ ok: true, ...debt });
  } catch (err) {
    next(err);
  }
};

export const adjustDebt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prayer, delta, date } = req.body as { prayer: PrayerId; delta: number; date?: string };
    const debt = await salatDebtService.adjustDebt(req.user.uid, prayer, delta, date);
    res.json({ ok: true, ...debt });
  } catch (err) {
    next(err);
  }
};

export const setDebt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prayer, count, date } = req.body as { prayer: PrayerId; count: number; date?: string };
    const debt = await salatDebtService.setDebt(req.user.uid, prayer, count, date);
    res.json({ ok: true, ...debt });
  } catch (err) {
    next(err);
  }
};

export const getDebtHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = Number(req.query['days'] ?? 30);
    const today = req.query['today'] as string | undefined;
    const weeks = await salatDebtService.getDebtHistory(req.user.uid, days, today);
    res.json({ ok: true, weeks });
  } catch (err) {
    next(err);
  }
};

export const deleteAllLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await salatService.deleteAllUserSalatLogs(req.user.uid);
    res.json({ ok: true, deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
};
