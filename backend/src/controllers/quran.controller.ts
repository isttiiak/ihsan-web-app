import { Request, Response, NextFunction } from 'express';
import * as quranService from '../services/quran.service.js';

export const read = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, pages, advancePosition } = req.body as {
      date: string; pages: number; advancePosition: boolean;
    };
    const result = await quranService.addReading(req.user.uid, date, pages, advancePosition);
    res.json({ ok: true, ...result });
  } catch (err) { next(err); }
};

export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = req.query['today'] as string | undefined;
    const summary = await quranService.getSummary(req.user.uid, today);
    res.json({ ok: true, ...summary });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await quranService.updateProfile(
      req.user.uid,
      req.body as quranService.QuranProfileUpdate
    );
    res.json({ ok: true, profile });
  } catch (err) { next(err); }
};

export const deleteAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await quranService.deleteAllUserQuranData(req.user.uid);
    res.json({ ok: true, ...result });
  } catch (err) { next(err); }
};
