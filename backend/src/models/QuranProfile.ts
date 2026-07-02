import mongoose, { Schema, Document } from 'mongoose';

/** Standard Madani mushaf page count */
export const QURAN_TOTAL_PAGES = 604;

export interface IQuranProfile extends Document {
  userId: string;
  /** Daily reading goal in pages */
  dailyGoalPages: number;
  /** Pages completed of the current khatm (0..603); reaching 604 completes it */
  currentPage: number;
  /** Number of complete read-throughs */
  khatmCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const quranProfileSchema = new Schema<IQuranProfile>(
  {
    userId: { type: String, required: true, unique: true },
    dailyGoalPages: { type: Number, default: 2, min: 1, max: 604 },
    currentPage: { type: Number, default: 0, min: 0, max: QURAN_TOTAL_PAGES - 1 },
    khatmCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IQuranProfile>('QuranProfile', quranProfileSchema);
