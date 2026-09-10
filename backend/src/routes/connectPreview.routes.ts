import { Router } from 'express';
import * as connectPreviewController from '../controllers/connectPreview.controller.js';

const router = Router();

// GET /connect/:code — bot-only link-unfurl preview (see vercel.json's
// User-Agent-matched rewrite). No auth: this is a public, read-only lookup
// of a display name already implied by the shared link itself.
router.get('/:code', connectPreviewController.getConnectPreview);

export default router;
