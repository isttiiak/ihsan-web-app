import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/verify — verify Firebase token and upsert user
router.post('/verify', authController.verifyHandler);

// GET /api/auth/me is intentionally removed — use GET /api/user/me instead

export default router;
