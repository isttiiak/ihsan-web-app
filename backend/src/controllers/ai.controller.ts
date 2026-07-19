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

export const simplifyHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text, language } = req.body as { text: string; language: 'en' | 'bn' };
    const result = await aiService.getSimplifiedTafsir({ text, language });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
};
