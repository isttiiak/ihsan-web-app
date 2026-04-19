import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as userController from '../controllers/user.controller.js';
import {
  updateUserSchema,
  linkGoogleSchema,
  unlinkGoogleSchema,
  setPrimaryEmailSchema,
} from '../validation/user.schemas.js';

const router = Router();

router.get('/me', requireAuth, userController.getUserHandler);
router.patch('/me', requireAuth, validate(updateUserSchema), userController.updateUserHandler);

// Linked Google account management
router.post('/link-google', requireAuth, validate(linkGoogleSchema), userController.linkGoogleHandler);
router.post('/unlink-google', requireAuth, validate(unlinkGoogleSchema), userController.unlinkGoogleHandler);
router.patch('/primary-email', requireAuth, validate(setPrimaryEmailSchema), userController.setPrimaryEmailHandler);

export default router;
