/**
 * Cron Job for Daily Streak and Goal Processing
 *
 * This should run once daily at midnight (Dhaka time - UTC+6)
 * In production, use a task scheduler like:
 * - node-cron
 * - bull/bee-queue
 * - AWS EventBridge
 * - Google Cloud Scheduler
 * - Heroku Scheduler
 */

import User from "../models/User.js";
import ZikrDaily from "../models/ZikrDaily.js";
import ZikrGoal from "../models/ZikrGoal.js";
import ZikrStreak from "../models/ZikrStreak.js";
import { truncateDhakaDate } from "../utils/timezone.js";

/**
 * Process all user streaks for yesterday
 * Called daily at midnight (Dhaka time)
 */
export async function processDailyStreaks() {
  try {
    console.log("🕐 Starting daily streak processing (Dhaka midnight)...");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = truncateDhakaDate(yesterday);

    // Get all users with active streaks or goals
    const users = await User.find({}).select("uid");

    let processed = 0;
    let streaksUpdated = 0;
    let streaksBroken = 0;

    for (const user of users) {
      try {
        const userId = user.uid;

        // Get yesterday's total count
        const yesterdayRecords = await ZikrDaily.find({
          userId,
          date: yesterdayDate,
        });
        const yesterdayTotal = yesterdayRecords.reduce(
          (sum, r) => sum + r.count,
          0
        );

        // Get user's goal
        let goal = await ZikrGoal.findOne({ userId });
        if (!goal) {
          goal = new ZikrGoal({ userId, dailyTarget: 100 });
          await goal.save();
        }

        const goalMet = yesterdayTotal >= goal.dailyTarget;

        // Get or create streak
        let streak = await ZikrStreak.findOne({ userId });
        if (!streak) {
          streak = new ZikrStreak({ userId });
        }

        // Update streak based on yesterday's performance
        const result = streak.updateStreak(yesterdayDate, goalMet);

        if (result.streakChanged) {
          await streak.save();
          streaksUpdated++;

          if (streak.currentStreak === 0) {
            streaksBroken++;
            console.log(
              `   ❌ Streak broken for user ${userId.substring(0, 8)}...`
            );
          } else {
            console.log(
              `   ✅ Streak updated for user ${userId.substring(0, 8)}... (${
                streak.currentStreak
              } days)`
            );
          }
        }

        processed++;
      } catch (userError) {
        console.error(`Error processing user ${user.uid}:`, userError);
      }
    }

    console.log(`✨ Daily processing complete:`);
    console.log(`   - Users processed: ${processed}`);
    console.log(`   - Streaks updated: ${streaksUpdated}`);
    console.log(`   - Streaks broken: ${streaksBroken}`);

    return {
      success: true,
      processed,
      streaksUpdated,
      streaksBroken,
    };
  } catch (error) {
    console.error("❌ Error in daily streak processing:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send streak reminders (optional)
 * Can be run earlier in the day (e.g., 6 PM) to remind users
 */
export async function sendStreakReminders() {
  try {
    console.log("📢 Sending streak reminders...");

    const today = truncateDhakaDate(Date.now());

    // Get all users who haven't met their goal today
    const users = await User.find({}).select("uid email");

    let remindersSent = 0;

    for (const user of users) {
      try {
        const userId = user.uid;

        // Check if goal is met today
        const todayRecords = await ZikrDaily.find({ userId, date: today });
        const todayTotal = todayRecords.reduce((sum, r) => sum + r.count, 0);

        const goal = await ZikrGoal.findOne({ userId });
        const streak = await ZikrStreak.findOne({ userId });

        if (!goal || !streak || streak.isPaused) continue;

        const goalMet = todayTotal >= goal.dailyTarget;

        if (!goalMet && streak.currentStreak > 0) {
          // User has an active streak but hasn't met today's goal
          // TODO: Send notification/email
          console.log(
            `   📧 Reminder sent to user ${userId.substring(0, 8)}... (${
              streak.currentStreak
            } day streak at risk)`
          );
          remindersSent++;
        }
      } catch (userError) {
        console.error(`Error sending reminder to user ${user.uid}:`, userError);
      }
    }

    console.log(`✨ Sent ${remindersSent} streak reminders`);

    return { success: true, remindersSent };
  } catch (error) {
    console.error("❌ Error sending reminders:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Clean up old daily records (optional)
 * Remove records older than 1 year to keep database lean
 */
export async function cleanupOldRecords() {
  try {
    console.log("🧹 Cleaning up old records...");

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const cutoffDate = truncateDhakaDate(oneYearAgo);

    const result = await ZikrDaily.deleteMany({
      date: { $lt: cutoffDate },
    });

    console.log(`✨ Deleted ${result.deletedCount} old daily records`);

    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error("❌ Error cleaning up old records:", error);
    return { success: false, error: error.message };
  }
}

// Example: How to set up with node-cron (if you choose to use it)
/*
import cron from 'node-cron';

// Run at midnight Dhaka time (18:00 UTC for UTC+6)
cron.schedule('0 18 * * *', async () => {
  await processDailyStreaks();
}, {
  scheduled: true,
  timezone: "Asia/Dhaka"
});

// Run streak reminders at 6 PM Dhaka time
cron.schedule('0 12 * * *', async () => {
  await sendStreakReminders();
}, {
  scheduled: true,
  timezone: "Asia/Dhaka"
});

// Clean up old records weekly (Sunday at 2 AM Dhaka time)
cron.schedule('0 20 * * 0', async () => {
  await cleanupOldRecords();
}, {
  scheduled: true,
  timezone: "Asia/Dhaka"
});
*/

export default {
  processDailyStreaks,
  sendStreakReminders,
  cleanupOldRecords,
};
