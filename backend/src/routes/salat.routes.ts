import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  updatePrayerSchema,
  updateNaflSchema,
  getSalatLogSchema,
  salatHistorySchema,
  adjustSalatDebtSchema,
  setSalatDebtSchema,
  salatDebtHistorySchema,
  resetSalatSchema,
} from '../validation/salat.schemas.js';
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

// GET /api/salat/debt — kaza (missed-prayer) debt per prayer
router.get('/debt', requireAuth, salatController.getDebt);
// PATCH /api/salat/debt/adjust — +/- one prayer's owed count (e.g. "paid one back")
router.patch(
  '/debt/adjust',
  requireAuth,
  validate(adjustSalatDebtSchema),
  salatController.adjustDebt
);
// PATCH /api/salat/debt/set — absolute set (initial estimate from before tracking)
router.patch('/debt/set', requireAuth, validate(setSalatDebtSchema), salatController.setDebt);
// GET /api/salat/debt/history — weekly accumulation-vs-payback buckets for the chart
router.get(
  '/debt/history',
  requireAuth,
  validate(salatDebtHistorySchema),
  salatController.getDebtHistory
);

// GET /api/salat/journey — full history of phases (account creation → each reset → today)
router.get('/journey', requireAuth, salatController.getJourney);
// POST /api/salat/reset — start fresh without deleting history
router.post('/reset', requireAuth, validate(resetSalatSchema), salatController.resetSalat);
// DELETE /api/salat/all — delete all salat logs for the authenticated user
router.delete('/all', requireAuth, salatController.deleteAllLogs);

export default router;
