import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as quranController from '../controllers/quran.controller.js';
import { quranReadSchema, quranSummarySchema, quranProfileSchema, quranReadAyatSchema, quranBookmarkSchema, quranHistorySchema } from '../validation/quran.schemas.js';

const router = Router();

// POST /api/quran/read — add pages for a day (optionally advance the bookmark)
router.post('/read', requireAuth, validate(quranReadSchema), quranController.read);

// POST /api/quran/read-ayat — v4 ayah engine (surah credit + khatam advance)
router.post('/read-ayat', requireAuth, validate(quranReadAyatSchema), quranController.readAyat);

// POST /api/quran/bookmark — toggle a saved ayah
router.post('/bookmark', requireAuth, validate(quranBookmarkSchema), quranController.toggleBookmark);

// GET /api/quran/history?days=&today= — daily units for analytics
router.get('/history', requireAuth, validate(quranHistorySchema), quranController.getHistory);

// GET /api/quran/summary?today= — profile, streak, khatm progress, pace
router.get('/summary', requireAuth, validate(quranSummarySchema), quranController.getSummary);

// PATCH /api/quran/profile — daily goal / bookmark position
router.patch('/profile', requireAuth, validate(quranProfileSchema), quranController.updateProfile);

// DELETE /api/quran/all — wipe all Quran data for the user
router.delete('/all', requireAuth, quranController.deleteAll);

export default router;
