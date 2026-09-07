import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as pushController from '../controllers/push.controller.js';
import {
  subscribeSchema,
  unsubscribeSchema,
  updatePreferencesSchema,
} from '../validation/push.schemas.js';

const router = Router();

router.get('/vapid-public-key', pushController.getVapidPublicKeyHandler);
router.post('/subscribe', requireAuth, validate(subscribeSchema), pushController.subscribeHandler);
router.post(
  '/unsubscribe',
  requireAuth,
  validate(unsubscribeSchema),
  pushController.unsubscribeHandler
);
router.get('/preferences', requireAuth, pushController.getPreferencesHandler);
router.patch(
  '/preferences',
  requireAuth,
  validate(updatePreferencesSchema),
  pushController.updatePreferencesHandler
);

export default router;
