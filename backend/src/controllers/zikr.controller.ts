import { Request, Response, NextFunction } from 'express';
import * as zikrService from '../services/zikr.service.js';
import * as streakService from '../services/streak.service.js';
import { DEFAULT_TIMEZONE_OFFSET } from '../utils/timezone-flexible.js';

export const incrementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { zikrType, amount = 1, ts, timezoneOffset } = req.body as {
      zikrType: string;
      amount?: number;
      ts?: number;
      timezoneOffset?: number;
    };

    const userOffset = timezoneOffset ?? DEFAULT_TIMEZONE_OFFSET;
    const result = await zikrService.incrementZikr(userId, zikrType, amount, userOffset, ts);
    const streakResult = await streakService.checkAndUpdateStreak(userId, userOffset);

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
    const { increments, timezoneOffset } = req.body as {
      increments: Array<{ zikrType: string; amount?: number; ts?: number }>;
      timezoneOffset?: number;
    };

    const userOffset = timezoneOffset ?? DEFAULT_TIMEZONE_OFFSET;
    const result = await zikrService.batchIncrementZikr(userId, increments, userOffset);
    const streakResult = await streakService.checkAndUpdateStreak(userId, userOffset);

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
    const summary = await zikrService.getZikrSummary(req.user.uid);
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
