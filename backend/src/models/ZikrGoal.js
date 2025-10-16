import mongoose from "mongoose";

const zikrGoalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    dailyTarget: { type: Number, required: true, default: 100, min: 1 }, // Overall daily target
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

zikrGoalSchema.index({ userId: 1 });

export default mongoose.model("ZikrGoal", zikrGoalSchema);
