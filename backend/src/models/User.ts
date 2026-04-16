import mongoose, { Document, Schema } from 'mongoose';

export interface IZikrTypeItem {
  _id: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
}

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  firstName?: string;
  lastName?: string;
  occupation?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_say';
  birthDate?: Date;
  bio?: string;
  city?: string;
  country?: string;
  aiEnabled: boolean;
  totalCount: number;
  zikrTotals: Map<string, number>;
  zikrTypes: mongoose.Types.DocumentArray<IZikrTypeItem & Document>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    displayName: { type: String },
    photoUrl: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    occupation: { type: String },
    bio: { type: String, maxlength: 250 },
    city: { type: String },
    country: { type: String },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_say'],
      default: undefined,
    },
    birthDate: { type: Date },
    aiEnabled: { type: Boolean, default: false },
    totalCount: { type: Number, default: 0 },
    zikrTotals: { type: Map, of: Number, default: {} },
    zikrTypes: {
      type: [
        {
          name: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [
        { name: 'SubhanAllah' },
        { name: 'Alhamdulillah' },
        { name: 'Allahu Akbar' },
        { name: 'La ilaha illallah' },
      ],
    },
  },
  { timestamps: true }
);

// Ensure uniqueness of zikrTypes.name per user (case-insensitive)
userSchema.pre('save', function (next) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = this as any;
  if (!doc.isModified('zikrTypes')) return next();
  const seen = new Set<string>();
  doc.zikrTypes = doc.zikrTypes.filter((t: { name: string }) => {
    const key = t.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  next();
});

export default mongoose.model<IUser>('User', userSchema);
