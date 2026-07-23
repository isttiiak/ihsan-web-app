import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/mongo.js';
import { initFirebaseAdmin } from '../backend/src/config/firebaseAdmin.js';

/**
 * Vercel serverless entry — the WHOLE Express backend runs as one function.
 *
 * - Every /api/* request is rewritten here (see /vercel.json); Vercel passes
 *   the ORIGINAL url through, so Express routes match unchanged.
 * - Firebase Admin initializes once per instance (module scope).
 * - connectDB() caches its promise (see config/mongo.ts): the first request on
 *   a cold instance pays the Atlas handshake, warm requests skip it entirely.
 * - No dotenv here — Vercel injects env vars directly.
 *
 * Local dev is untouched: backend/src/index.ts is still the dev server.
 */
const initPromise = initFirebaseAdmin();

// An Express app IS a (req, res) handler — the cast only papers over
// @types/express requiring `next` in the call signature.
const expressApp = app as unknown as (req: IncomingMessage, res: ServerResponse) => void;

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await initPromise;
    // /api/health doesn't touch the DB, so a Mongo outage must not block it —
    // log and let mongoose buffer (and time out) any queries that do need it.
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed', err);
  }
  expressApp(req, res);
}
