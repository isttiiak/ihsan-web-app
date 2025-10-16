import mongoose from "mongoose";

const zikrStreakSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    currentStreak: { type: Number, default: 0, min: 0 }, // Current consecutive days
    longestStreak: { type: Number, default: 0, min: 0 }, // Best streak ever
    lastCompletedDate: { type: Date, default: null }, // Last date goal was met (UTC midnight)
    isPaused: { type: Boolean, default: false }, // Pause feature
    pausedAt: { type: Date, default: null }, // When streak was paused
    pausedStreak: { type: Number, default: 0 }, // Streak value when paused
  },
  { timestamps: true }
);

zikrStreakSchema.index({ userId: 1 });

// Method to check and update streak based on today's count
zikrStreakSchema.methods.updateStreak = function (todayDate, goalMet) {
  const today = new Date(todayDate);
  today.setUTCHours(0, 0, 0, 0);

  // If paused, don't update streak
  if (this.isPaused) {
    return { streakChanged: false, message: "Streak is paused" };
  }

  const lastDate = this.lastCompletedDate
    ? new Date(this.lastCompletedDate)
    : null;

  if (!lastDate) {
    // First time completing goal
    if (goalMet) {
      this.currentStreak = 1;
      this.longestStreak = Math.max(this.longestStreak, 1);
      this.lastCompletedDate = today;
      return { streakChanged: true, message: "Streak started!" };
    }
    return { streakChanged: false, message: "Goal not met" };
  }

  const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Same day, already counted
    return { streakChanged: false, message: "Already counted today" };
  } else if (daysDiff === 1) {
    // Consecutive day
    if (goalMet) {
      this.currentStreak += 1;
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
      this.lastCompletedDate = today;
      return { streakChanged: true, message: "Streak continued!" };
    } else {
      return { streakChanged: false, message: "Goal not met today" };
    }
  } else if (daysDiff === 2) {
    // Missed 1 day, streak continues if goal met today
    if (goalMet) {
      this.currentStreak += 1;
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
      this.lastCompletedDate = today;
      return {
        streakChanged: true,
        message: "Streak continued (1 day grace)",
      };
    } else {
      // Missed 2 consecutive days, reset
      this.currentStreak = 0;
      this.lastCompletedDate = null;
      return { streakChanged: true, message: "Streak reset (2 days missed)" };
    }
  } else {
    // Missed 2+ consecutive days, reset
    if (goalMet) {
      this.currentStreak = 1;
      this.longestStreak = Math.max(this.longestStreak, 1);
      this.lastCompletedDate = today;
      return { streakChanged: true, message: "Streak restarted!" };
    } else {
      this.currentStreak = 0;
      this.lastCompletedDate = null;
      return { streakChanged: true, message: "Streak reset" };
    }
  }
};

// Method to pause streak
zikrStreakSchema.methods.pause = function () {
  if (this.isPaused) {
    return { ok: false, message: "Already paused" };
  }
  this.isPaused = true;
  this.pausedAt = new Date();
  this.pausedStreak = this.currentStreak;
  return { ok: true, message: "Streak paused" };
};

// Method to resume streak
zikrStreakSchema.methods.resume = function () {
  if (!this.isPaused) {
    return { ok: false, message: "Not paused" };
  }
  this.isPaused = false;
  // Keep the streak as it was when paused
  this.currentStreak = this.pausedStreak;
  this.pausedAt = null;
  this.pausedStreak = 0;
  return { ok: true, message: "Streak resumed" };
};

export default mongoose.model("ZikrStreak", zikrStreakSchema);
