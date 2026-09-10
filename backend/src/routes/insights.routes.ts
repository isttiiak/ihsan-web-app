import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { worshipCorrelationSchema } from '../validation/insights.schemas.js';
import * as insightsController from '../controllers/insights.controller.js';

const router = Router();

// GET /api/insights/worship-correlation — fasting vs. non-fasting days,
// compared across salat completion, zikr count, and Quran reading.
router.get(
  '/worship-correlation',
  requireAuth,
  validate(worshipCorrelationSchema),
  insightsController.getWorshipCorrelation
);

export default router;
