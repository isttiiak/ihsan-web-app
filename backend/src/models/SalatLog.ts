import mongoose, { Schema, Document } from 'mongoose';

export type PrayerStatus = 'prayed' | 'mosque' | 'kaza' | 'missed' | 'pending';

export const PRAYER_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerId = (typeof PRAYER_IDS)[number];

export interface IPrayerEntry {
  status: PrayerStatus;
  loggedAt?: Date;
}

export interface ISalatLog extends Document {
  userId: string;
  date: string; // YYYY-MM-DD in user's local timezone
  prayers: Record<PrayerId, IPrayerEntry>;
  createdAt: Date;
  updatedAt: Date;
}

const prayerEntrySchema = new Schema<IPrayerEntry>(
  {
    status: {
      type: String,
      enum: ['prayed', 'mosque', 'kaza', 'missed', 'pending'],
      default: 'pending',
    },
    loggedAt: { type: Date },
  },
  { _id: false }
);

const salatLogSchema = new Schema<ISalatLog>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    prayers: {
      fajr: { type: prayerEntrySchema, default: () => ({ status: 'pending' }) },
      dhuhr: { type: prayerEntrySchema, default: () => ({ status: 'pending' }) },
      asr: { type: prayerEntrySchema, default: () => ({ status: 'pending' }) },
      maghrib: { type: prayerEntrySchema, default: () => ({ status: 'pending' }) },
      isha: { type: prayerEntrySchema, default: () => ({ status: 'pending' }) },
    },
  },
  { timestamps: true }
);

salatLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<ISalatLog>('SalatLog', salatLogSchema);
