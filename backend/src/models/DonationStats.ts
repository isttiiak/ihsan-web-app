import mongoose, { Document, Schema } from 'mongoose';

export interface IQuarterlyEntry {
  quarter: string; // 'YYYY-Qn', e.g. '2026-Q3' — sortable as a plain string
  received: number;
  spent: number;
  notes: string;
}

export interface IDonationStats extends Document<string> {
  totalVerifiedAmount: number;
  totalVerifiedCount: number;
  lastUpdated: Date;
  quarterlyBreakdown: IQuarterlyEntry[];
}

// Single cached-aggregate document (_id: 'current') — the public /stats
// endpoint reads only this, so it structurally can never leak donor PII
// regardless of what's added to the `donations` collection later.
const donationStatsSchema = new Schema<IDonationStats>({
  _id: { type: String, required: true },
  totalVerifiedAmount: { type: Number, default: 0 },
  totalVerifiedCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  quarterlyBreakdown: {
    type: [
      {
        quarter: { type: String, required: true },
        received: { type: Number, default: 0 },
        spent: { type: Number, default: 0 },
        notes: { type: String, default: '' },
      },
    ],
    default: [],
  },
});

export default mongoose.model<IDonationStats>('DonationStats', donationStatsSchema);
