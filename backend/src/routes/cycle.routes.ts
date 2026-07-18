import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as cycleController from '../controllers/cycle.controller.js';
import { startCycleSchema, endCycleSchema, cycleProfileSchema, cycleDaySchema, pastCycleSchema } from '../validation/cycle.schemas.js';

const router = Router();

// GET /api/cycle/summary?today= — status + prediction + recent logs
router.get('/summary', requireAuth, cycleController.getSummary);

// POST /api/cycle/start — begin a hayd/nifas episode
router.post('/start', requireAuth, validate(startCycleSchema), cycleController.startCycle);

// POST /api/cycle/end — end the active episode
router.post('/end', requireAuth, validate(endCycleSchema), cycleController.endCycle);

// POST /api/cycle/logs — backfill a completed past episode (history import)
router.post('/logs', requireAuth, validate(pastCycleSchema), cycleController.addPastCycle);

// PUT /api/cycle/day — per-day wellness note (flow/symptoms/mood)
router.put('/day', requireAuth, validate(cycleDaySchema), cycleController.upsertDay);

// PATCH /api/cycle/profile — madhab setting
router.patch('/profile', requireAuth, validate(cycleProfileSchema), cycleController.updateProfile);

// DELETE /api/cycle/logs/:logId — remove one episode
router.delete('/logs/:logId', requireAuth, cycleController.deleteLog);

// DELETE /api/cycle/all — remove everything (Settings "Your data")
router.delete('/all', requireAuth, cycleController.deleteAll);

export default router;
