import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as socialController from '../controllers/social.controller.js';
import { connectSchema, socialSummarySchema } from '../validation/social.schemas.js';

const router = Router();

// GET /api/social/summary?today=&timezoneOffset= — invite code + ranked leaderboard
router.get('/summary', requireAuth, validate(socialSummarySchema), socialController.getSummary);

// GET /api/social/noor?today=&timezoneOffset= — viewer's Noor (today + all-time)
router.get('/noor', requireAuth, validate(socialSummarySchema), socialController.getNoor);

// POST /api/social/connect { code } — connect with the invite link's owner
router.post('/connect', requireAuth, validate(connectSchema), socialController.connect);

// GET /api/social/friends — friend list with connected-since dates (manage view)
router.get('/friends', requireAuth, socialController.getFriendsList);

// DELETE /api/social/friends/:friendUid — mutual disconnect
router.delete('/friends/:friendUid', requireAuth, socialController.unfriend);

export default router;
