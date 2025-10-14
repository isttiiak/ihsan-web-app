import admin from "firebase-admin";

let initialized = false;

export const initFirebaseAdmin = () => {
  if (initialized) return;
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn(
      "Firebase Admin not fully configured. Auth verification may fail."
    );
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  initialized = true;
  console.log("Firebase Admin initialized");
};

export const isFirebaseInitialized = () => initialized;

export const verifyFirebaseToken = async (idToken) => {
  if (!initialized) throw new Error("Firebase Admin not initialized");
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded;
};

export const decodeUnverifiedJwt = (jwt) => {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );
    // Normalize uid like Firebase Admin verifyIdToken output
    if (!payload.uid && payload.user_id) payload.uid = payload.user_id;
    return payload;
  } catch {
    return null;
  }
};
