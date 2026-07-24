import type { DecodedIdToken } from 'firebase-admin/auth';

// firebase-admin v14 pulls in `jose` (ESM-only) at module load. Import the
// admin subpackages lazily so ts-jest / CJS-loaded tests never touch them
// when DEV_AUTH_BYPASS short-circuits the auth middleware.

let initialized = false;

// Environment stores (Vercel, CI, .env) frequently mangle a PEM private key:
// they wrap it in single/double quotes and/or store the newlines as the literal
// two-character sequence "\n". Normalize both so Node's crypto can decode it.
const normalizePrivateKey = (raw: string): string => {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
};

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

  // firebase-admin v14 EAGERLY validates the private key inside cert() via
  // crypto.createPrivateKey(). A malformed FIREBASE_PRIVATE_KEY therefore
  // throws here and — because api/index.ts awaits this before every request —
  // crashes the ENTIRE serverless function (every route, incl. /api/health,
  // returns FUNCTION_INVOCATION_FAILED). This app only calls verifyIdToken(),
  // which needs the project ID + Google's public certs, NOT the service-account
  // private key. So if cert() fails, degrade to a projectId-only app so auth
  // keeps working instead of taking the whole backend down.
  try {
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: normalizePrivateKey(FIREBASE_PRIVATE_KEY),
      }),
    });
    initialized = true;
    if (process.env.NODE_ENV !== 'test') {
      console.log('Firebase Admin initialized');
    }
  } catch (err) {
    console.error(
      'Firebase cert() failed — falling back to projectId-only init (verifyIdToken still works):',
      (err as Error)?.message,
    );
    initializeApp({ projectId: FIREBASE_PROJECT_ID });
    initialized = true;
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
