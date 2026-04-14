import admin from 'firebase-admin';

let initialized = false;

export const initFirebaseAdmin = (): void => {
  if (initialized) return;
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Firebase Admin not fully configured. Auth verification may fail.');
    }
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
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

export const verifyFirebaseToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  if (!initialized) throw new Error('Firebase Admin not initialized');
  return admin.auth().verifyIdToken(idToken);
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
