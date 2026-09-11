import mongoose, { Schema, Document } from 'mongoose';

export type HifzState = 'new' | 'learning' | 'consolidating' | 'solid';
export type HifzResult = 'easy' | 'hesitant' | 'forgot';

/**
 * One per (userId, surah, ayah) the user has chosen to memorise — created on
 * demand, never pre-seeded for all 6236 ayat. Drives the SM-2 spaced-repetition
 * schedule: `dueDate` says when it next needs a recall attempt, `state` is
 * derived from `interval`/`reps` for the weak-spot heatmap.
 */
export interface IHifzEntry extends Document {
  userId: string;
  surah: number;
  ayah: number;
  state: HifzState;
  /** SM-2 repetition interval, in days */
  interval: number;
  /** SM-2 ease factor, floor 1.3, default 2.5 */
  easeFactor: number;
  /** Consecutive successful (non-"forgot") reviews */
  reps: number;
  /** Total times this ayah has been marked "forgot" */
  lapses: number;
  /** Local civil date (YYYY-MM-DD) this entry is next due for review */
  dueDate: string;
  lastResult: HifzResult | null;
  lastReviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const hifzEntrySchema = new Schema<IHifzEntry>(
  {
    userId: { type: String, required: true },
    surah: { type: Number, required: true, min: 1, max: 114 },
    ayah: { type: Number, required: true, min: 1, max: 286 },
    state: { type: String, enum: ['new', 'learning', 'consolidating', 'solid'], default: 'new' },
    interval: { type: Number, default: 0, min: 0 },
    easeFactor: { type: Number, default: 2.5, min: 1.3 },
    reps: { type: Number, default: 0, min: 0 },
    lapses: { type: Number, default: 0, min: 0 },
    dueDate: { type: String, required: true },
    lastResult: { type: String, enum: ['easy', 'hesitant', 'forgot', null], default: null },
    lastReviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

hifzEntrySchema.index({ userId: 1, surah: 1, ayah: 1 }, { unique: true });
hifzEntrySchema.index({ userId: 1, dueDate: 1 });

export default mongoose.model<IHifzEntry>('HifzEntry', hifzEntrySchema);
