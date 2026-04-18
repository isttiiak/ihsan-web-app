import mongoose, { Document, Schema } from 'mongoose';

export interface IZikrStreakMethods {
  updateStreak(todayDate: Date, goalMet: boolean): { streakChanged: boolean; message: string };
  pause(): { ok: boolean; message: string };
  resume(): { ok: boolean; message: string };
}

export interface IZikrStreak extends Document, IZikrStreakMethods {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: Date | null;
  isPaused: boolean;
  pausedAt: Date | null;
  pausedStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

const zikrStreakSchema = new Schema<IZikrStreak>(
  {
    userId: { type: String, required: true, unique: true },
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastCompletedDate: { type: Date, default: null },
    isPaused: { type: Boolean, default: false },
    pausedAt: { type: Date, default: null },
    pausedStreak: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// userId has unique:true above — no separate index needed

zikrStreakSchema.methods.updateStreak = function (
  todayDate: Date,
  goalMet: boolean
): { streakChanged: boolean; message: string } {
  const today = new Date(todayDate);
  today.setUTCHours(0, 0, 0, 0);

  if (this.isPaused) {
    return { streakChanged: false, message: 'Streak is paused' };
  }

  const lastDate = this.lastCompletedDate ? new Date(this.lastCompletedDate) : null;

  if (!lastDate) {
    if (goalMet) {
      this.currentStreak = 1;
      this.longestStreak = Math.max(this.longestStreak, 1);
      this.lastCompletedDate = today;
      return { streakChanged: true, message: 'Streak started!' };
    }
    return { streakChanged: false, message: 'Goal not met' };
  }

  const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    return { streakChanged: false, message: 'Already counted today' };
  } else if (daysDiff === 1) {
    if (goalMet) {
      this.currentStreak += 1;
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
      this.lastCompletedDate = today;
      return { streakChanged: true, message: 'Streak continued!' };
    }
    return { streakChanged: false, message: 'Goal not met today' };
  } else if (daysDiff === 2) {
    if (goalMet) {
      this.currentStreak += 1;
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
      this.lastCompletedDate = today;
      return { streakChanged: true, message: 'Streak continued (1 day grace)' };
    }
    // Goal not yet met today — preserve streak; user still has the rest of today
    return { streakChanged: false, message: 'Grace period active — hit your goal today to continue' };
  } else {
    if (goalMet) {
      this.currentStreak = 1;
      this.longestStreak = Math.max(this.longestStreak, 1);
      this.lastCompletedDate = today;
      return { streakChanged: true, message: 'Streak restarted!' };
    } else {
      this.currentStreak = 0;
      this.lastCompletedDate = null;
      return { streakChanged: true, message: 'Streak reset' };
    }
  }
};

zikrStreakSchema.methods.pause = function (): { ok: boolean; message: string } {
  if (this.isPaused) return { ok: false, message: 'Already paused' };
  this.isPaused = true;
  this.pausedAt = new Date();
  this.pausedStreak = this.currentStreak;
  return { ok: true, message: 'Streak paused' };
};

zikrStreakSchema.methods.resume = function (): { ok: boolean; message: string } {
  if (!this.isPaused) return { ok: false, message: 'Not paused' };
  this.isPaused = false;
  this.currentStreak = this.pausedStreak;
  this.pausedAt = null;
  this.pausedStreak = 0;
  return { ok: true, message: 'Streak resumed' };
};

export default mongoose.model<IZikrStreak>('ZikrStreak', zikrStreakSchema);
