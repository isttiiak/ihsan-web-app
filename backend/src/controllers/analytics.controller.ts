import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analytics.service.js';
import * as streakService from '../services/streak.service.js';
import { DEFAULT_TIMEZONE_OFFSET, truncateToTimezone } from '../utils/timezone-flexible.js';
import ZikrDaily from '../models/ZikrDaily.js';

export const getAnalyticsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days = '7', timezoneOffset } = req.query as { days?: string; timezoneOffset?: string };
    const userOffset = timezoneOffset !== undefined ? parseInt(timezoneOffset) : DEFAULT_TIMEZONE_OFFSET;
    const data = await analyticsService.getAnalyticsData(req.user.uid, parseInt(days), userOffset);
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const getGoalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const goal = await analyticsService.getGoal(req.user.uid);
    res.json({ ok: true, goal });
  } catch (err) {
    next(err);
  }
};

export const setGoalHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { dailyTarget } = req.body as { dailyTarget: number };
    const goal = await analyticsService.setGoal(req.user.uid, dailyTarget);
    res.json({ ok: true, goal });
  } catch (err) {
    next(err);
  }
};

export const getStreakHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const streak = await streakService.getStreak(req.user.uid);
    res.json({ ok: true, streak });
  } catch (err) {
    next(err);
  }
};

export const pauseStreakHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await streakService.pauseStreak(req.user.uid);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const resumeStreakHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await streakService.resumeStreak(req.user.uid);
    if (!result) {
      res.status(404).json({ ok: false, error: 'Streak not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const checkStreakHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.uid;
    const today = truncateToTimezone(Date.now(), DEFAULT_TIMEZONE_OFFSET);

    const todayRecords = await ZikrDaily.find({ userId, date: today });
    const todayTotal = todayRecords.reduce((sum, r) => sum + r.count, 0);

    const goal = await analyticsService.getGoal(userId);
    const goalMet = todayTotal >= goal.dailyTarget;
    const result = await streakService.checkAndUpdateStreak(userId);

    res.json({
      ok: true,
      todayTotal,
      goalMet,
      streak: result?.streak,
      message: 'Streak checked',
    });
  } catch (err) {
    next(err);
  }
};

export const compareAnalyticsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { days = '7' } = req.query as { days?: string };
    const daysNum = parseInt(days);

    const today = truncateToTimezone(Date.now(), DEFAULT_TIMEZONE_OFFSET);
    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - daysNum + 1);

    const lastPeriodEnd = new Date(periodStart);
    lastPeriodEnd.setDate(lastPeriodEnd.getDate() - 1);
    const lastPeriodStart = new Date(lastPeriodEnd);
    lastPeriodStart.setDate(lastPeriodStart.getDate() - daysNum + 1);

    const currentRecords = await ZikrDaily.find({ userId, date: { $gte: periodStart, $lte: today } });
    const currentTotal = currentRecords.reduce((sum, r) => sum + r.count, 0);

    const lastRecords = await ZikrDaily.find({ userId, date: { $gte: lastPeriodStart, $lte: lastPeriodEnd } });
    const lastTotal = lastRecords.reduce((sum, r) => sum + r.count, 0);

    const difference = currentTotal - lastTotal;
    const percentChange = lastTotal > 0 ? parseFloat(((difference / lastTotal) * 100).toFixed(1)) : 0;

    res.json({
      ok: true,
      current: {
        total: currentTotal,
        period: `${periodStart.toISOString().split('T')[0] ?? ''} to ${today.toISOString().split('T')[0] ?? ''}`,
      },
      last: {
        total: lastTotal,
        period: `${lastPeriodStart.toISOString().split('T')[0] ?? ''} to ${lastPeriodEnd.toISOString().split('T')[0] ?? ''}`,
      },
      comparison: {
        difference,
        percentChange,
        trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable',
      },
    });
  } catch (err) {
    next(err);
  }
};
