import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as zikrController from '../controllers/zikr.controller.js';
import { incrementSchema, batchIncrementSchema, addZikrTypeSchema } from '../validation/zikr.schemas.js';

const router = Router();

router.post('/increment', requireAuth, validate(incrementSchema), zikrController.incrementHandler);
router.post('/increment/batch', requireAuth, validate(batchIncrementSchema), zikrController.batchIncrementHandler);
router.get('/summary', requireAuth, zikrController.getSummaryHandler);
router.get('/types', requireAuth, zikrController.getTypesHandler);
router.post('/types', requireAuth, validate(addZikrTypeSchema), zikrController.addTypeHandler);

export default router;
