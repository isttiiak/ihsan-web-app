import mongoose, { Schema, Document } from 'mongoose';

/**
 * Per-user Rayhanah Cycle settings. The madhab choice only affects the
 * maximum-hayd threshold used for the istihada guidance (Hanafi: 10 days;
 * majority/Shafi'i: 15 days). Nifas guidance uses 40 days for both
 * (Umm Salamah's report, Abu Dawud 311) with the difference noted in the UI.
 */
export interface ICycleProfile extends Document {
  userId: string;
  madhab: 'hanafi' | 'majority';
}

const CycleProfileSchema = new Schema<ICycleProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    madhab: { type: String, enum: ['hanafi', 'majority'], default: 'majority' },
  },
  { timestamps: true }
);

export default mongoose.model<ICycleProfile>('CycleProfile', CycleProfileSchema);
