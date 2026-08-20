import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as aiController from '../controllers/ai.controller.js';
import {
  aiSuggestSchema, aiWeeklySchema, aiComebackSchema, aiComfortSchema,
  aiStreakCoachSchema, aiFastingCompanionSchema, aiActivityInsightSchema,
} from '../validation/ai.schemas.js';

const router = Router();

// Encouragement & personalization only — never a source of religious evidence.
router.post('/suggest', requireAuth, validate(aiSuggestSchema), aiController.suggestHandler);
router.post('/weekly-summary', requireAuth, validate(aiWeeklySchema), aiController.weeklyHandler);
router.post('/comeback', requireAuth, validate(aiComebackSchema), aiController.comebackHandler);
router.post('/comfort', requireAuth, validate(aiComfortSchema), aiController.comfortHandler);
router.post('/streak-coaching', requireAuth, validate(aiStreakCoachSchema), aiController.streakCoachHandler);
router.post('/fasting-companion', requireAuth, validate(aiFastingCompanionSchema), aiController.fastingCompanionHandler);
router.post('/activity-insight', requireAuth, validate(aiActivityInsightSchema), aiController.activityInsightHandler);

export default router;
