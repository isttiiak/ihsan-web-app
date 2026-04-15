import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updatePrayerSchema, getSalatLogSchema, salatHistorySchema } from '../validation/salat.schemas.js';
import * as salatController from '../controllers/salat.controller.js';

const router = Router();

// GET /api/salat          — today's log (or ?date=YYYY-MM-DD)
router.get('/', requireAuth, validate(getSalatLogSchema), salatController.getLog);

// PATCH /api/salat/prayer — update a single prayer status
router.patch('/prayer', requireAuth, validate(updatePrayerSchema), salatController.updatePrayer);

// GET /api/salat/history  — last N days of logs
router.get('/history', requireAuth, validate(salatHistorySchema), salatController.getHistory);

// GET /api/salat/analytics
router.get('/analytics', requireAuth, validate(salatHistorySchema), salatController.getAnalytics);

export default router;
