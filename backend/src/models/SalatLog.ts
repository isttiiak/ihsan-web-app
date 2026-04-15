import mongoose, { Schema, Document } from 'mongoose';

/**
 * Primary prayer status:
 *   completed — prayed on time
 *   kaza      — prayed but late (counts as prayed for analytics)
 *   missed    — not prayed
 *   pending   — not yet logged
 */
export type PrayerStatus = 'completed' | 'kaza' | 'missed' | 'pending';

/**
 * Location sub-tag (only relevant when status is completed or kaza):
 *   home    — default (prayed alone at home)
 *   mosque  — prayed at mosque (implies in congregation)
 *   jamat   — prayed in congregation but not at mosque
 */
export type PrayerLocation = 'home' | 'mosque' | 'jamat';

export const PRAYER_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerId = (typeof PRAYER_IDS)[number];

export interface IPrayerEntry {
  status: PrayerStatus;
  /** Exact timestamp when the user tapped the status — used for AI analysis */
  prayedAt?: Date;
  /** Where/how they prayed — only set when status is completed or kaza */
  location?: PrayerLocation;
  /** Whether the user performed tasbeeh (dhikr) after salat */
  tasbeeh?: boolean;
}

export interface ISalatLog extends Document {
  userId: string;
  /** YYYY-MM-DD in user's local timezone */
  date: string;
  prayers: Record<PrayerId, IPrayerEntry>;
  createdAt: Date;
  updatedAt: Date;
}

const prayerEntrySchema = new Schema<IPrayerEntry>(
  {
    status: {
      type: String,
      enum: ['completed', 'kaza', 'missed', 'pending'],
      default: 'pending',
    },
    prayedAt: { type: Date },
    location: {
      type: String,
      enum: ['home', 'mosque', 'jamat'],
    },
    tasbeeh: { type: Boolean, default: false },
  },
  { _id: false }
);

const defaultEntry = (): IPrayerEntry => ({ status: 'pending' });

const salatLogSchema = new Schema<ISalatLog>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    prayers: {
      fajr:    { type: prayerEntrySchema, default: defaultEntry },
      dhuhr:   { type: prayerEntrySchema, default: defaultEntry },
      asr:     { type: prayerEntrySchema, default: defaultEntry },
      maghrib: { type: prayerEntrySchema, default: defaultEntry },
      isha:    { type: prayerEntrySchema, default: defaultEntry },
    },
  },
  { timestamps: true }
);

// Compound unique index — also acts as the userId index
salatLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<ISalatLog>('SalatLog', salatLogSchema);
