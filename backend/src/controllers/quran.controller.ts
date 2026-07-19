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

export const readAyat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, count, surah, advanceKhatm, completedSurah } = req.body as {
      date: string; count: number; surah?: number; advanceKhatm?: boolean; completedSurah?: boolean;
    };
    const result = await quranService.addAyatReading(req.user.uid, { date, count, surah, advanceKhatm, completedSurah });
    res.json({ ok: true, khatmCompleted: result.khatmCompleted, currentAyah: result.profile.currentAyah, todayAyat: quranService.unitsOf(result.log) });
  } catch (err) { next(err); }
};

export const toggleBookmark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { surah, ayah } = req.body as { surah: number; ayah: number };
    const bookmarks = await quranService.toggleBookmark(req.user.uid, surah, ayah);
    res.json({ ok: true, bookmarks });
  } catch (err) { next(err); }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = Number(req.query.days) || 30;
    const today = typeof req.query.today === 'string' ? req.query.today : undefined;
    const history = await quranService.getHistory(req.user.uid, days, today);
    res.json({ ok: true, history });
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
