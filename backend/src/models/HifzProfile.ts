import mongoose, { Schema, Document } from 'mongoose';

export interface IHifzProfile extends Document {
  userId: string;
  /** New ayat per day target */
  dailyNewTarget: number;
  /** Revisions (recall attempts) per day target */
  dailyRevisionTarget: number;
  /** Sequential "add next ayah" cursor — mirrors QuranProfile's khatam bookmark */
  nextSurah: number;
  nextAyah: number;
  createdAt: Date;
  updatedAt: Date;
}

const hifzProfileSchema = new Schema<IHifzProfile>(
  {
    userId: { type: String, required: true, unique: true },
    dailyNewTarget: { type: Number, default: 3, min: 0, max: 200 },
    dailyRevisionTarget: { type: Number, default: 15, min: 0, max: 1000 },
    nextSurah: { type: Number, default: 1, min: 1, max: 114 },
    nextAyah: { type: Number, default: 1, min: 1, max: 286 },
  },
  { timestamps: true }
);

export default mongoose.model<IHifzProfile>('HifzProfile', hifzProfileSchema);
