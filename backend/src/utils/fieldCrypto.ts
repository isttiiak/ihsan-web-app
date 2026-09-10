import crypto from 'crypto';

/**
 * Application-level field encryption for data that must stay unreadable even
 * to someone with raw DB/Atlas access (Rayhanah wellness notes, a user's own
 * Groq API key). AES-256-GCM, one random IV per value. Layout: iv(12) +
 * authTag(16) + ciphertext, base64-encoded as a single string.
 *
 * NOT for fields that need to be queried, sorted, or indexed — those stay
 * plaintext (see CycleLog dates/type, which the app's own logic already
 * treats as non-social, server-only data).
 */

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'FIELD_ENCRYPTION_KEY is not set — required to read/write encrypted fields (see backend/.env.example).'
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must be a base64-encoded 32-byte (256-bit) key.');
  }
  cachedKey = key;
  return key;
}

/** Encrypt any JSON-serializable value into a single opaque string. */
export function encryptJson(value: unknown): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

/**
 * Decrypt a value produced by encryptJson. Returns null for empty input or
 * on any failure (wrong/rotated key, corrupt data) rather than throwing —
 * callers treat that the same as "no data yet".
 */
export function decryptJson<T>(payload: string | null | undefined): T | null {
  if (!payload) return null;
  try {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, IV_LEN);
    const authTag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
    const ciphertext = buf.subarray(IV_LEN + AUTH_TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(plaintext.toString('utf8')) as T;
  } catch (e) {
    console.warn('[fieldCrypto] decrypt failed', (e as Error).message);
    return null;
  }
}
