import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service.js';

export const suggestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userSummary } = req.body as { userSummary?: string };
    const result = await aiService.getSuggestions(userSummary ?? '');
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const reflectHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { surah, ayah, text } = req.body as { surah: number; ayah: number; text: string };
    const result = await aiService.getReflection({ surah, ayah, text });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const weeklyHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stats } = req.body as { stats?: Record<string, unknown> };
    const result = await aiService.getWeeklySummary(stats ?? {});
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const comebackHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { daysAway, bestStreak } = req.body as { daysAway: number; bestStreak?: number };
    const result = await aiService.getComebackNudge({ daysAway, bestStreak });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const comfortHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { moods, symptoms } = req.body as { moods: string[]; symptoms?: string[] };
    const result = await aiService.getMoodComfort({ moods, symptoms });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
};
