import { Request, Response, NextFunction } from 'express';
import * as zikrService from '../services/zikr.service.js';
import * as streakService from '../services/streak.service.js';
import { DEFAULT_TIMEZONE_OFFSET } from '../utils/timezone-flexible.js';

export const incrementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { zikrType, amount = 1, ts, timezoneOffset, today } = req.body as {
      zikrType: string;
      amount?: number;
      ts?: number;
      timezoneOffset?: number;
      today?: string;
    };

    const userOffset = timezoneOffset ?? DEFAULT_TIMEZONE_OFFSET;
    const result = await zikrService.incrementZikr(userId, zikrType, amount, userOffset, ts);
    const streakResult = await streakService.checkAndUpdateStreak(userId, userOffset, today);

    res.json({
      ok: true,
      ...result,
      streak: streakResult?.streak,
      todayTotal: streakResult?.todayTotal,
      goalMet: streakResult?.goalMet,
    });
  } catch (err) {
    next(err);
  }
};

export const batchIncrementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { increments, timezoneOffset, today } = req.body as {
      increments: Array<{ zikrType: string; amount?: number; ts?: number }>;
      timezoneOffset?: number;
      today?: string;
    };

    const userOffset = timezoneOffset ?? DEFAULT_TIMEZONE_OFFSET;
    const result = await zikrService.batchIncrementZikr(userId, increments, userOffset);
    const streakResult = await streakService.checkAndUpdateStreak(userId, userOffset, today);

    res.json({
      ok: true,
      ...result,
      streak: streakResult?.streak,
      todayTotal: streakResult?.todayTotal,
      goalMet: streakResult?.goalMet,
    });
  } catch (err) {
    next(err);
  }
};

export const getSummaryHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawOffset = Number(req.query.timezoneOffset);
    const timezoneOffset = Number.isFinite(rawOffset) ? rawOffset : undefined;
    const todayQ = typeof req.query.today === 'string' ? req.query.today : undefined;
    const summary = await zikrService.getZikrSummary(req.user.uid, timezoneOffset, todayQ);
    res.json({ ok: true, ...summary });
  } catch (err) {
    next(err);
  }
};

export const getTypesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const types = await zikrService.getZikrTypes(req.user.uid);
    res.json({ ok: true, types });
  } catch (err) {
    next(err);
  }
};

export const addTypeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body as { name: string };
    const types = await zikrService.addZikrType(req.user.uid, name.trim());
    res.json({ ok: true, types });
  } catch (err) {
    next(err);
  }
};
export const renameTypeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { oldName, newName } = req.body as { oldName: string; newName: string };
    const types = await zikrService.renameZikrType(req.user.uid, oldName, newName);
    res.json({ ok: true, types });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404 || status === 409) {
      res.status(status).json({ ok: false, error: (err as Error).message });
      return;
    }
    next(err);
  }
};

export const removeTypeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawName = req.params.name;
    const name = decodeURIComponent((Array.isArray(rawName) ? rawName[0] : rawName) ?? '').trim();
    if (!name) { res.status(400).json({ ok: false, error: 'Name required' }); return; }
    const types = await zikrService.removeZikrType(req.user.uid, name);
    res.json({ ok: true, types });
  } catch (err) {
    next(err);
  }
};

export const deleteAllZikrData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await zikrService.deleteAllUserZikrData(req.user.uid);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
