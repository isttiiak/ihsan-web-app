import ZikrDaily from '../models/ZikrDaily.js';
import ZikrGoal from '../models/ZikrGoal.js';
import ZikrStreak, { IZikrStreak } from '../models/ZikrStreak.js';
import { truncateToTimezone, DEFAULT_TIMEZONE_OFFSET } from '../utils/timezone-flexible.js';

export interface StreakCheckResult {
  goalMet: boolean;
  streak: IZikrStreak;
  todayTotal: number;
}

export async function checkAndUpdateStreak(
  userId: string,
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET
): Promise<StreakCheckResult | null> {
  try {
    const today = truncateToTimezone(Date.now(), timezoneOffset);

    const todayRecords = await ZikrDaily.find({ userId, date: today });
    const todayTotal = todayRecords.reduce((sum, r) => sum + r.count, 0);

    let goal = await ZikrGoal.findOne({ userId });
    if (!goal) {
      goal = new ZikrGoal({ userId, dailyTarget: 100 });
      await goal.save();
    }

    const goalMet = todayTotal >= goal.dailyTarget;

    let streak = await ZikrStreak.findOne({ userId });
    if (!streak) streak = new ZikrStreak({ userId });

    streak.updateStreak(today, goalMet);
    await streak.save();

    return { goalMet, streak, todayTotal };
  } catch (err) {
    console.error('Error checking streak:', err);
    return null;
  }
}

export async function getStreak(userId: string): Promise<IZikrStreak> {
  let streak = await ZikrStreak.findOne({ userId });
  if (!streak) {
    streak = new ZikrStreak({ userId });
    await streak.save();
  }
  return streak;
}

export async function pauseStreak(userId: string): Promise<{ ok: boolean; message: string; streak: IZikrStreak }> {
  let streak = await ZikrStreak.findOne({ userId });
  if (!streak) streak = new ZikrStreak({ userId });

  const result = streak.pause();
  if (result.ok) await streak.save();

  return { ok: result.ok, message: result.message, streak };
}

export async function resumeStreak(userId: string): Promise<{ ok: boolean; message: string; streak: IZikrStreak } | null> {
  const streak = await ZikrStreak.findOne({ userId });
  if (!streak) return null;

  const result = streak.resume();
  if (result.ok) await streak.save();

  return { ok: result.ok, message: result.message, streak };
}
