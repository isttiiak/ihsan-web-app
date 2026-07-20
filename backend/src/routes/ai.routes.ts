import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as aiController from '../controllers/ai.controller.js';
import { aiSuggestSchema, aiReflectSchema, aiWeeklySchema, aiComebackSchema, aiComfortSchema } from '../validation/ai.schemas.js';

const router = Router();

// Encouragement & personalization only — never a source of religious evidence.
// (Tafsir explanation is deliberately NOT an AI feature — see ai.service.ts.)
router.post('/suggest', requireAuth, validate(aiSuggestSchema), aiController.suggestHandler);
router.post('/reflect', requireAuth, validate(aiReflectSchema), aiController.reflectHandler);
router.post('/weekly-summary', requireAuth, validate(aiWeeklySchema), aiController.weeklyHandler);
router.post('/comeback', requireAuth, validate(aiComebackSchema), aiController.comebackHandler);
router.post('/comfort', requireAuth, validate(aiComfortSchema), aiController.comfortHandler);

export default router;
