import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiUserLimiter } from '../middleware/rateLimiter.js';
import * as aiController from '../controllers/ai.controller.js';
import {
  aiSuggestSchema,
  aiWeeklySchema,
  aiComebackSchema,
  aiComfortSchema,
  aiStreakCoachSchema,
  aiFastingCompanionSchema,
  aiActivityInsightSchema,
} from '../validation/ai.schemas.js';

const router = Router();

// Encouragement & personalization only — never a source of religious evidence.
// aiUserLimiter runs after requireAuth (per-UID, 20/day) — the IP-based
// aiLimiter at the /api/ai mount point in app.ts is the outer, pre-auth guard.
router.post(
  '/suggest',
  requireAuth,
  aiUserLimiter,
  validate(aiSuggestSchema),
  aiController.suggestHandler
);
router.post(
  '/weekly-summary',
  requireAuth,
  aiUserLimiter,
  validate(aiWeeklySchema),
  aiController.weeklyHandler
);
router.post(
  '/comeback',
  requireAuth,
  aiUserLimiter,
  validate(aiComebackSchema),
  aiController.comebackHandler
);
router.post(
  '/comfort',
  requireAuth,
  aiUserLimiter,
  validate(aiComfortSchema),
  aiController.comfortHandler
);
router.post(
  '/streak-coaching',
  requireAuth,
  aiUserLimiter,
  validate(aiStreakCoachSchema),
  aiController.streakCoachHandler
);
router.post(
  '/fasting-companion',
  requireAuth,
  aiUserLimiter,
  validate(aiFastingCompanionSchema),
  aiController.fastingCompanionHandler
);
router.post(
  '/activity-insight',
  requireAuth,
  aiUserLimiter,
  validate(aiActivityInsightSchema),
  aiController.activityInsightHandler
);

export default router;
