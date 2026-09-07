import mongoose, { Document, Schema } from 'mongoose';

export interface IPushCategories {
  streakAtRisk: boolean;
  adhkarWindows: boolean;
  weeklySummary: boolean;
  /** Reserved — not sent yet. Precise per-prayer timing needs a scheduler
   * that can fire more than once a day; see push.service.ts's runDailyPushCheck
   * doc comment for why this stays off until then. */
  adhan: boolean;
}

export interface IPushSubscription extends Document {
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  categories: IPushCategories;
  userAgent?: string;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    categories: {
      streakAtRisk: { type: Boolean, default: true },
      adhkarWindows: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: true },
      adhan: { type: Boolean, default: false },
    },
    userAgent: { type: String },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);
