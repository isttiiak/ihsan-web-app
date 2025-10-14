import mongoose from "mongoose";

const zikrTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true }, // Firebase UID
    email: { type: String, required: true },
    displayName: { type: String },
    photoUrl: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    occupation: { type: String },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_say"],
      default: undefined,
    },
    birthDate: { type: Date },
    aiEnabled: { type: Boolean, default: false },
    // Cumulative totals
    totalCount: { type: Number, default: 0 },
    zikrTotals: { type: Map, of: Number, default: {} },
    // Redefined as subdocuments with unique name validation
    zikrTypes: {
      type: [zikrTypeSchema],
      default: [
        { name: "SubhanAllah" },
        { name: "Alhamdulillah" },
        { name: "Allahu Akbar" },
        { name: "La ilaha illallah" },
      ],
    },
  },
  { timestamps: true }
);

// Ensure uniqueness of zikrTypes.name per user (case-insensitive)
userSchema.pre("save", function (next) {
  if (!this.isModified("zikrTypes")) return next();
  const seen = new Set();
  this.zikrTypes = this.zikrTypes.filter((t) => {
    const key = t.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  next();
});

export default mongoose.model("User", userSchema);
