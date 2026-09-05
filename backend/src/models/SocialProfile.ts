import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export const MAX_FRIENDS = 50;

export interface ISocialProfile extends Document {
  userId: string;
  /** Stable, url-safe code embedded in the user's invite link */
  inviteCode: string;
  /** Firebase uids of connected friends (mutual — both docs list each other) */
  friends: string[];
  /** friend uid → date the connection was made (missing for pre-migration friendships) */
  friendSince: Map<string, Date>;
  /** Uids who opened MY invite link and are awaiting my accept/reject */
  pendingIncoming: string[];
  /** Uids whose invite link I opened, awaiting their accept/reject */
  pendingOutgoing: string[];
  /** Uids I've blocked — they can no longer reach me via invite code, and any
   * existing friendship/pending request between us is torn down immediately */
  blocked: string[];
  /** When true, NO ONE (not even existing friends) sees this user's stats on
   * their leaderboard — a full opt-out, not just "hide from new people" */
  invisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const socialProfileSchema = new Schema<ISocialProfile>(
  {
    userId: { type: String, required: true, unique: true },
    inviteCode: { type: String, required: true, unique: true },
    friends: { type: [String], default: [] },
    friendSince: { type: Map, of: Date, default: {} },
    pendingIncoming: { type: [String], default: [] },
    pendingOutgoing: { type: [String], default: [] },
    blocked: { type: [String], default: [] },
    invisible: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('base64url'); // 8 url-safe chars
}

export default mongoose.model<ISocialProfile>('SocialProfile', socialProfileSchema);
