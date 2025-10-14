import mongoose from "mongoose";

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
    zikrTypes: {
      type: [
        {
          name: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
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

export default mongoose.model("User", userSchema);
