import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as aiController from '../controllers/ai.controller.js';
import { aiSuggestSchema } from '../validation/ai.schemas.js';

const router = Router();

// requireAuth added — the AI endpoint was previously unauthenticated
router.post('/suggest', requireAuth, validate(aiSuggestSchema), aiController.suggestHandler);

export default router;
