import mongoose from "mongoose";

const zikrSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Firebase UID
    date: { type: Date, required: true },
    zikrType: { type: String, required: true },
    count: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

zikrSessionSchema.index({ userId: 1, date: 1 });

export default mongoose.model("ZikrSession", zikrSessionSchema);
