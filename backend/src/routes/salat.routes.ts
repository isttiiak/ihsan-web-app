import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updatePrayerSchema, updateNaflSchema, getSalatLogSchema, salatHistorySchema } from '../validation/salat.schemas.js';
import * as salatController from '../controllers/salat.controller.js';

const router = Router();

// GET /api/salat          — today's log (or ?date=YYYY-MM-DD)
router.get('/', requireAuth, validate(getSalatLogSchema), salatController.getLog);

// PATCH /api/salat/prayer — update a single fard prayer
router.patch('/prayer', requireAuth, validate(updatePrayerSchema), salatController.updatePrayer);

// PATCH /api/salat/nafl   — update nafl prayer entry
router.patch('/nafl', requireAuth, validate(updateNaflSchema), salatController.updateNafl);

// GET /api/salat/history
router.get('/history', requireAuth, validate(salatHistorySchema), salatController.getHistory);

// GET /api/salat/analytics
router.get('/analytics', requireAuth, validate(salatHistorySchema), salatController.getAnalytics);

export default router;
