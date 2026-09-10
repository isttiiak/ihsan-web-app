import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiUserLimiter } from '../middleware/rateLimiter.js';
import * as naturalLogController from '../controllers/naturalLog.controller.js';
import { naturalLogParseSchema, naturalLogCommitSchema } from '../validation/naturalLog.schemas.js';

const router = Router();

// POST /api/natural-log/parse — free-text note -> structured preview (AI, read-only)
router.post(
  '/parse',
  requireAuth,
  aiUserLimiter,
  validate(naturalLogParseSchema),
  naturalLogController.parseHandler
);

// POST /api/natural-log/commit — the (possibly user-edited) preview -> real
// writes across salat/quran/zikr. No AI call here, so no aiUserLimiter.
router.post(
  '/commit',
  requireAuth,
  validate(naturalLogCommitSchema),
  naturalLogController.commitHandler
);

export default router;
