import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as userController from '../controllers/user.controller.js';
import { updateUserSchema } from '../validation/user.schemas.js';

const router = Router();

router.get('/me', requireAuth, userController.getUserHandler);
router.patch('/me', requireAuth, validate(updateUserSchema), userController.updateUserHandler);

export default router;
