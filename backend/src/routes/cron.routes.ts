import { Router } from 'express';
import * as pushController from '../controllers/push.controller.js';

const router = Router();

// No requireAuth — see push.controller.ts's runPushCronHandler for the
// CRON_SECRET check that guards this instead.
router.get('/push-check', pushController.runPushCronHandler);

export default router;
