import { Request, Response } from 'express';
import {
  verifyFirebaseToken,
  isFirebaseInitialized,
  decodeUnverifiedJwt,
} from '../config/firebaseAdmin.js';
import User from '../models/User.js';

export const verifyHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const header = req.headers.authorization ?? '';
    const tokenFromHeader = header.startsWith('Bearer ') ? header.slice(7) : null;
    const idToken = (req.body as { idToken?: string })?.idToken ?? tokenFromHeader;

    if (!idToken) {
      res.status(400).json({ ok: false, error: 'idToken required' });
      return;
    }

    let decoded: Record<string, unknown>;

    if (isFirebaseInitialized()) {
      decoded = await verifyFirebaseToken(idToken) as unknown as Record<string, unknown>;
    } else if (process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === '1') {
      const payload = decodeUnverifiedJwt(idToken);
      if (!payload?.['uid']) {
        res.status(401).json({ ok: false, error: 'Invalid token' });
        return;
      }
      decoded = payload;
    } else {
      res.status(500).json({ ok: false, error: 'Auth not configured' });
      return;
    }

    const uid = decoded['uid'] as string;
    const email = decoded['email'] as string;
    const displayName = (decoded['name'] as string | undefined);
    const picture = decoded['picture'] as string | undefined;

    // Always update email (can change in Firebase).
    // Only set displayName and photoUrl on first creation — never overwrite values
    // the user has manually edited in their Profile page.
    const user = await User.findOneAndUpdate(
      { uid },
      {
        $set: { uid, email },
        $setOnInsert: {
          displayName: displayName ?? '',
          ...(picture ? { photoUrl: picture } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true, user });
  } catch (err) {
    const error = err as { code?: string; message?: string; errorInfo?: { code: string; message: string } };
    const code = error?.code ?? error?.errorInfo?.code ?? null;
    const message = error?.message ?? error?.errorInfo?.message ?? 'Unauthorized';
    if (process.env.NODE_ENV !== 'test') {
      console.error('/api/auth/verify error:', code, message);
    }
    res.status(401).json({ ok: false, error: 'Invalid token', code, message });
  }
};
