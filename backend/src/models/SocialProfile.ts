import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export const MAX_FRIENDS = 50;

export interface ISocialProfile extends Document {
  userId: string;
  /** Stable, url-safe code embedded in the user's invite link */
  inviteCode: string;
  /** Firebase uids of connected friends (mutual — both docs list each other) */
  friends: string[];
  createdAt: Date;
  updatedAt: Date;
}

const socialProfileSchema = new Schema<ISocialProfile>(
  {
    userId: { type: String, required: true, unique: true },
    inviteCode: { type: String, required: true, unique: true },
    friends: { type: [String], default: [] },
  },
  { timestamps: true }
);

export function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('base64url'); // 8 url-safe chars
}

export default mongoose.model<ISocialProfile>('SocialProfile', socialProfileSchema);
