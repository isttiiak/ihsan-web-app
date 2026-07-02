import mongoose, { Schema, Document } from 'mongoose';

export interface IQuranLog extends Document {
  userId: string;
  /** Local civil date, client-authoritative */
  date: string;
  /** Pages read that day (accumulated; standard 604-page mushaf) */
  pages: number;
  createdAt: Date;
  updatedAt: Date;
}

const quranLogSchema = new Schema<IQuranLog>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    pages: { type: Number, required: true, min: 0, max: 700 },
  },
  { timestamps: true }
);

quranLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IQuranLog>('QuranLog', quranLogSchema);
