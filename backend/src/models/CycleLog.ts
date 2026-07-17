import mongoose, { Schema, Document } from 'mongoose';

/**
 * One menstrual (hayd) or post-natal (nifas) bleeding episode.
 * Dates are client-authoritative local civil strings (YYYY-MM-DD) like salat
 * and fasting. endDate is null while the episode is ongoing.
 *
 * PRIVACY: this collection must NEVER be exposed through any social endpoint.
 * The leaderboard only consumes it indirectly (excused-day Noor substitution)
 * and no "excused" flag ever leaves the server.
 */
export interface ICycleLog extends Document {
  userId: string;
  type: 'hayd' | 'nifas';
  startDate: string;
  endDate: string | null;
  note?: string;
}

const CycleLogSchema = new Schema<ICycleLog>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['hayd', 'nifas'], default: 'hayd' },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    note: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

CycleLogSchema.index({ userId: 1, startDate: 1 }, { unique: true });

export default mongoose.model<ICycleLog>('CycleLog', CycleLogSchema);
