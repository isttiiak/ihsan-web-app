import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as aiController from '../controllers/ai.controller.js';
import { aiSuggestSchema, aiReflectSchema, aiWeeklySchema, aiSimplifySchema } from '../validation/ai.schemas.js';

const router = Router();

// Encouragement & personalization only — never a source of religious evidence.
router.post('/suggest', requireAuth, validate(aiSuggestSchema), aiController.suggestHandler);
router.post('/reflect', requireAuth, validate(aiReflectSchema), aiController.reflectHandler);
router.post('/weekly-summary', requireAuth, validate(aiWeeklySchema), aiController.weeklyHandler);
// Faithful plain-language rephrase of an EXISTING (sourced) tafsir excerpt.
router.post('/simplify', requireAuth, validate(aiSimplifySchema), aiController.simplifyHandler);

export default router;
