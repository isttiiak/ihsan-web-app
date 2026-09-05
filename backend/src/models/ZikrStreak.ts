import mongoose, { Document, Schema } from 'mongoose';

// NOTE: this document is NOT a live streak counter. `currentStreak` +
// `lastCompletedDate` act only as a CREDIT ANCHOR, read and written directly
// by pause/resume in streak.service.ts — the actual streak is derived fresh
// from ZikrDaily on every read (see getStreakStatus there for the full
// explanation). There used to be `updateStreak`/`pause`/`resume` instance
// methods here implementing an older live-counter model; they were never
// called once streak.service.ts's derived approach replaced them, so they
// were removed rather than left as a second, dead implementation to trip
// over. Field-level mutations happen directly on the document instead.
export interface IZikrStreak extends Document {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: Date | null;
  isPaused: boolean;
  pausedAt: Date | null;
  pausedStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

const zikrStreakSchema = new Schema<IZikrStreak>(
  {
    userId: { type: String, required: true, unique: true },
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastCompletedDate: { type: Date, default: null },
    isPaused: { type: Boolean, default: false },
    pausedAt: { type: Date, default: null },
    pausedStreak: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// userId has unique:true above — no separate index needed

export default mongoose.model<IZikrStreak>('ZikrStreak', zikrStreakSchema);
