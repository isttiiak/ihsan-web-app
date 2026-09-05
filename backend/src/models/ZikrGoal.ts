import mongoose, { Document, Schema } from 'mongoose';

export interface IZikrGoal extends Document {
  userId: string;
  dailyTarget: number;
  isActive: boolean;
  /** Consecutive missed days forgiven before the streak resets (0-3). See
   * streak.service.ts's getStreakStatus for how this is applied. */
  graceDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const zikrGoalSchema = new Schema<IZikrGoal>(
  {
    userId: { type: String, required: true, unique: true },
    dailyTarget: { type: Number, required: true, default: 100, min: 1 },
    isActive: { type: Boolean, default: true },
    graceDays: { type: Number, default: 1, min: 0, max: 3 },
  },
  { timestamps: true }
);

// userId has unique:true above — no separate index needed
export default mongoose.model<IZikrGoal>('ZikrGoal', zikrGoalSchema);
