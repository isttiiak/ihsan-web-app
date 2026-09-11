import mongoose, { Schema, Document } from 'mongoose';

export interface IHifzLog extends Document {
  userId: string;
  /** Local civil date, client-authoritative */
  date: string;
  /** Ayat newly started into memorisation this day */
  newCount: number;
  /** Recall attempts (any self-assessment result) made this day */
  revisionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const hifzLogSchema = new Schema<IHifzLog>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    newCount: { type: Number, default: 0, min: 0 },
    revisionCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

hifzLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IHifzLog>('HifzLog', hifzLogSchema);
