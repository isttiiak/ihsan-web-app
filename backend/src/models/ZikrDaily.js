import mongoose from "mongoose";

const zikrDailySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    date: { type: Date, required: true }, // truncated to UTC midnight
    zikrType: { type: String, required: true },
    count: { type: Number, required: true, min: 0 }, // cumulative for that day+type
  },
  { timestamps: true }
);

zikrDailySchema.index({ userId: 1, date: 1, zikrType: 1 }, { unique: true });

export default mongoose.model("ZikrDaily", zikrDailySchema);
