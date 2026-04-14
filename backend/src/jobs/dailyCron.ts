import User from '../models/User.js';
import ZikrDaily from '../models/ZikrDaily.js';
import ZikrGoal from '../models/ZikrGoal.js';
import ZikrStreak from '../models/ZikrStreak.js';
import { truncateDhakaDate } from '../utils/timezone.js';

export async function processDailyStreaks(): Promise<{
  success: boolean;
  processed?: number;
  streaksUpdated?: number;
  streaksBroken?: number;
  error?: string;
}> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = truncateDhakaDate(yesterday);

    const users = await User.find({}).select('uid');
    let processed = 0;
    let streaksUpdated = 0;
    let streaksBroken = 0;

    for (const user of users) {
      try {
        const userId = user.uid;
        const yesterdayRecords = await ZikrDaily.find({ userId, date: yesterdayDate });
        const yesterdayTotal = yesterdayRecords.reduce((sum, r) => sum + r.count, 0);

        let goal = await ZikrGoal.findOne({ userId });
        if (!goal) {
          goal = new ZikrGoal({ userId, dailyTarget: 100 });
          await goal.save();
        }

        const goalMet = yesterdayTotal >= goal.dailyTarget;
        let streak = await ZikrStreak.findOne({ userId });
        if (!streak) streak = new ZikrStreak({ userId });

        const result = streak.updateStreak(yesterdayDate, goalMet);
        if (result.streakChanged) {
          await streak.save();
          streaksUpdated++;
          if (streak.currentStreak === 0) streaksBroken++;
        }
        processed++;
      } catch (userError) {
        console.error(`Error processing user ${user.uid}:`, userError);
      }
    }

    return { success: true, processed, streaksUpdated, streaksBroken };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function sendStreakReminders(): Promise<{ success: boolean; remindersSent?: number; error?: string }> {
  try {
    const { truncateDhakaDate: truncate } = await import('../utils/timezone.js');
    const today = truncate(Date.now());
    const users = await User.find({}).select('uid email');
    let remindersSent = 0;

    for (const user of users) {
      try {
        const userId = user.uid;
        const todayRecords = await ZikrDaily.find({ userId, date: today });
        const todayTotal = todayRecords.reduce((sum, r) => sum + r.count, 0);
        const goal = await ZikrGoal.findOne({ userId });
        const streak = await ZikrStreak.findOne({ userId });

        if (!goal || !streak || streak.isPaused) continue;
        if (todayTotal < goal.dailyTarget && streak.currentStreak > 0) {
          remindersSent++;
        }
      } catch (userError) {
        console.error(`Error sending reminder to user ${user.uid}:`, userError);
      }
    }

    return { success: true, remindersSent };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function cleanupOldRecords(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const cutoffDate = truncateDhakaDate(oneYearAgo);
    const result = await ZikrDaily.deleteMany({ date: { $lt: cutoffDate } });
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export default { processDailyStreaks, sendStreakReminders, cleanupOldRecords };
