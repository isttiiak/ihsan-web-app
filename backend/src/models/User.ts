import mongoose, { Document, Schema } from 'mongoose';

export interface IZikrTypeItem {
  _id: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
}

export interface ILinkedProvider {
  provider: string; // 'google.com'
  email: string;
  providerUid: string; // Google's sub-UID
}

export interface ISalatResetEntry {
  date: string; // YYYY-MM-DD — first day of the new phase
  note: string;
  resetAt: Date;
}

export interface IUser extends Document {
  uid: string;
  email: string;
  primaryEmail?: string;
  linkedProviders?: ILinkedProvider[];
  displayName?: string;
  photoUrl?: string;
  firstName?: string;
  lastName?: string;
  occupation?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_say';
  birthDate?: Date;
  bio?: string;
  city?: string;
  country?: string;
  /** Minutes offset from UTC, e.g. 360 for UTC+6. Populated opportunistically
   * whenever the client subscribes to push (see push.service.ts) — used ONLY
   * by the cron-driven push scheduler, which has no live request to read a
   * fresh timezoneOffset param from. Every other endpoint still takes
   * timezoneOffset as a transient per-request param; this is not a second
   * source of truth for those. */
  timezoneOffset?: number;
  /** Saved location, reused (never re-requested) from the client's own
   * `ihsan_location` — populated the same way as timezoneOffset, for a future
   * server-side adhan-time push scheduler. Not read by anything yet. */
  location?: { lat: number; lng: number };
  hijriOffset: number;
  aiEnabled: boolean;
  /** User's own Groq API key (AES-256-GCM, see utils/fieldCrypto.ts) — opt-in
   * alternative to the app's shared GROQ_API_KEY. Write-only from the API's
   * perspective: never decrypted back out to a client, only used server-side
   * in ai.service.ts. Null/unset means "use the shared key". */
  groqApiKeyEnc?: string | null;
  /** When the current groqApiKeyEnc was saved — surfaced read-only in
   * Settings ("added on ...") so the user has some confirmation the key is
   * actually stored, without ever re-exposing the key itself. Cleared
   * alongside groqApiKeyEnc. */
  groqApiKeySetAt?: Date | null;
  salatResetDate?: string;
  salatResetHistory: ISalatResetEntry[];
  totalCount: number;
  zikrTotals: Map<string, number>;
  zikrTypes: mongoose.Types.DocumentArray<IZikrTypeItem & Document>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    primaryEmail: { type: String },
    linkedProviders: {
      type: [
        {
          provider: { type: String, required: true },
          email: { type: String, required: true },
          providerUid: { type: String, required: true },
        },
      ],
      default: [],
    },
    displayName: { type: String },
    photoUrl: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    occupation: { type: String },
    bio: { type: String, maxlength: 250 },
    city: { type: String },
    country: { type: String },
    timezoneOffset: { type: Number },
    location: {
      type: new Schema({ lat: Number, lng: Number }, { _id: false }),
      required: false,
      default: undefined,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_say'],
      default: undefined,
    },
    birthDate: { type: Date },
    hijriOffset: { type: Number, default: 0, min: -1, max: 1 },
    aiEnabled: { type: Boolean, default: false },
    groqApiKeyEnc: { type: String, default: null },
    groqApiKeySetAt: { type: Date, default: null },
    salatResetDate: { type: String, default: undefined },
    salatResetHistory: {
      type: [
        {
          date: { type: String, required: true },
          note: { type: String, default: '' },
          resetAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    totalCount: { type: Number, default: 0 },
    zikrTotals: { type: Map, of: Number, default: {} },
    zikrTypes: {
      type: [
        {
          name: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [
        { name: 'SubhanAllah' },
        { name: 'Alhamdulillah' },
        { name: 'Allahu Akbar' },
        { name: 'La ilaha illallah' },
      ],
    },
  },
  { timestamps: true }
);

// Ensure uniqueness of zikrTypes.name per user (case-insensitive)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose v9: async pre-hook; `this` isn't typed as the hydrated document
userSchema.pre('save', async function (this: any) {
  if (!this.isModified('zikrTypes')) return;
  const seen = new Set<string>();
  this.zikrTypes = this.zikrTypes.filter((t: { name: string }) => {
    const key = t.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});

export default mongoose.model<IUser>('User', userSchema);
