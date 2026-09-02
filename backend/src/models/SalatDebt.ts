import mongoose, { Schema, Document } from 'mongoose';
import { PRAYER_IDS, PrayerId } from './SalatLog.js';

/**
 * Missed-prayer (kaza) debt — one atomic counter per fard prayer. Incremented
 * automatically when a prayer is marked 'missed' (and decremented if that mark
 * is later undone — see updatePrayerStatus in salat.service.ts), and adjustable
 * by hand for debt owed from before the user started tracking, or paid back
 * outside of any specific logged day.
 */
export interface ISalatDebt extends Document {
  userId: string;
  owed: Record<PrayerId, number>;
  createdAt: Date;
  updatedAt: Date;
}

const counterSchema = new Schema(
  Object.fromEntries(PRAYER_IDS.map((id) => [id, { type: Number, default: 0, min: 0 }])),
  { _id: false }
);

const salatDebtSchema = new Schema<ISalatDebt>(
  {
    userId: { type: String, required: true, unique: true },
    owed: { type: counterSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model<ISalatDebt>('SalatDebt', salatDebtSchema);
