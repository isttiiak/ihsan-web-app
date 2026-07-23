import type { DecodedIdToken } from 'firebase-admin/auth';

// firebase-admin v14 pulls in `jose` (ESM-only) at module load. Import the
// admin subpackages lazily so ts-jest / CJS-loaded tests never touch them
// when DEV_AUTH_BYPASS short-circuits the auth middleware.

let initialized = false;

export const initFirebaseAdmin = async (): Promise<void> => {
  if (initialized) return;
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Firebase Admin not fully configured. Auth verification may fail.');
    }
    return;
  }

  const { initializeApp, cert } = await import('firebase-admin/app');
  initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  initialized = true;
  if (process.env.NODE_ENV !== 'test') {
    console.log('Firebase Admin initialized');
  }
};

export const isFirebaseInitialized = (): boolean => initialized;

export const verifyFirebaseToken = async (idToken: string): Promise<DecodedIdToken> => {
  if (!initialized) throw new Error('Firebase Admin not initialized');
  const { getAuth } = await import('firebase-admin/auth');
  return getAuth().verifyIdToken(idToken);
};

export const decodeUnverifiedJwt = (jwt: string): Record<string, unknown> | null => {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
    // Normalize uid like Firebase Admin verifyIdToken output
    if (!payload['uid'] && payload['user_id']) payload['uid'] = payload['user_id'];
    return payload;
  } catch {
    return null;
  }
};
