import mongoose, { Document, Schema } from 'mongoose';

export interface IZikrGoal extends Document {
  userId: string;
  dailyTarget: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const zikrGoalSchema = new Schema<IZikrGoal>(
  {
    userId: { type: String, required: true, unique: true },
    dailyTarget: { type: Number, required: true, default: 100, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// userId has unique:true above — no separate index needed
export default mongoose.model<IZikrGoal>('ZikrGoal', zikrGoalSchema);
