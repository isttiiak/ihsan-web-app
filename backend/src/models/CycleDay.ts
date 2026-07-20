import mongoose, { Schema, Document } from 'mongoose';

/**
 * Optional per-day wellness note during a cycle — flow intensity, symptoms,
 * mood. Purely private (same hard rule as CycleLog: never exposed through any
 * social endpoint). One row per user per local day.
 */
export const CYCLE_FLOWS = ['light', 'medium', 'heavy'] as const;
export const CYCLE_SYMPTOMS = [
  'cramps', 'headache', 'fatigue', 'nausea', 'backache', 'bloating', 'tenderness', 'insomnia',
] as const;
export const CYCLE_MOODS = ['calm', 'happy', 'low', 'irritable', 'anxious', 'tired'] as const;

export interface ICycleDay extends Document {
  userId: string;
  date: string; // YYYY-MM-DD (local, client-authoritative)
  flow: (typeof CYCLE_FLOWS)[number] | null;
  symptoms: string[];
  /** Multiple moods per day — a day can hold several feelings (Istiak). */
  moods: string[];
  /** Legacy single-mood field (pre-multi). Read-only fallback, no longer written. */
  mood?: (typeof CYCLE_MOODS)[number] | null;
}

const CycleDaySchema = new Schema<ICycleDay>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    flow: { type: String, enum: [...CYCLE_FLOWS, null], default: null },
    symptoms: { type: [String], default: [] },
    moods: { type: [String], default: [] },
    // Legacy single mood kept so pre-existing rows aren't lost on read.
    mood: { type: String, enum: [...CYCLE_MOODS, null], default: null },
  },
  { timestamps: true }
);

CycleDaySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<ICycleDay>('CycleDay', CycleDaySchema);
