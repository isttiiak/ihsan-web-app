import User from '../models/User.js';
import ZikrDaily from '../models/ZikrDaily.js';
import ZikrGoal, { IZikrGoal } from '../models/ZikrGoal.js';
import ZikrStreak, { IZikrStreak } from '../models/ZikrStreak.js';
import { truncateToTimezone, DEFAULT_TIMEZONE_OFFSET } from '../utils/timezone-flexible.js';
import { ChartDataPoint } from '../types/api.types.js';

export interface AnalyticsData {
  period: { days: number; startDate: string; endDate: string };
  chartData: ChartDataPoint[];
  stats: { average: number; maxDay: string | null; maxCount: number; total: number };
  today: { total: number; goalMet: boolean; perType: Array<{ zikrType: string; total: number }> };
  goal: IZikrGoal | { dailyTarget: number; isActive: boolean };
  streak: IZikrStreak | { currentStreak: number; longestStreak: number };
  allTime: { totalCount: number; bestDay: { date: Date | null; count: number } };
  perType: Array<{ zikrType: string; total: number }>;
}

export async function getAnalyticsData(
  userId: string,
  days: number = 7,
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET
): Promise<AnalyticsData> {
  const today = truncateToTimezone(Date.now(), timezoneOffset);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days + 1);

  const records = await ZikrDaily.find({
    userId,
    date: { $gte: startDate, $lte: today },
  }).sort({ date: 1 });

  const dailyTotals: Record<string, number> = {};
  const dailyBreakdown: Record<string, Record<string, number>> = {};

  records.forEach((r) => {
    const dateStr = r.date.toISOString().split('T')[0] ?? '';
    if (!dailyTotals[dateStr]) {
      dailyTotals[dateStr] = 0;
      dailyBreakdown[dateStr] = {};
    }
    dailyTotals[dateStr] = (dailyTotals[dateStr] ?? 0) + r.count;
    const bd = dailyBreakdown[dateStr] ?? {};
    bd[r.zikrType] = (bd[r.zikrType] ?? 0) + r.count;
    dailyBreakdown[dateStr] = bd;
  });

  const chartData: ChartDataPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0] ?? '';
    chartData.push({
      date: dateStr,
      total: dailyTotals[dateStr] ?? 0,
      breakdown: dailyBreakdown[dateStr] ?? {},
    });
  }

  const totals = chartData.map((d) => d.total);
  const maxDay = chartData.reduce(
    (max, d) => (d.total > max.total ? d : max),
    chartData[0] ?? { date: null as unknown as string, total: 0, breakdown: {} }
  );
  const average = totals.length > 0 ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0;

  const goal = await ZikrGoal.findOne({ userId });
  const streak = await ZikrStreak.findOne({ userId });

  const todayRecords = await ZikrDaily.find({ userId, date: today });
  const todayTotal = todayRecords.reduce((sum, r) => sum + r.count, 0);
  const todayPerType = todayRecords.map((r) => ({ zikrType: r.zikrType, total: r.count }));

  const user = await User.findOne({ uid: userId });

  let perType: Array<{ zikrType: string; total: number }> = [];
  if (user?.zikrTotals instanceof Map) {
    perType = [...user.zikrTotals.entries()].map(([zikrType, total]) => ({ zikrType, total }));
  } else if (user?.zikrTotals && typeof user.zikrTotals === 'object') {
    perType = Object.entries(user.zikrTotals as unknown as Record<string, number>).map(([zikrType, total]) => ({ zikrType, total }));
  }

  const allDailyRecords = await ZikrDaily.aggregate([
    { $match: { userId } },
    { $group: { _id: '$date', total: { $sum: '$count' } } },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]) as Array<{ _id: Date; total: number }>;

  const bestDay = allDailyRecords.length > 0
    ? { date: allDailyRecords[0]?._id ?? null, count: allDailyRecords[0]?.total ?? 0 }
    : { date: null, count: 0 };

  return {
    period: {
      days,
      startDate: startDate.toISOString().split('T')[0] ?? '',
      endDate: today.toISOString().split('T')[0] ?? '',
    },
    chartData,
    stats: {
      average,
      maxDay: maxDay.date ?? null,
      maxCount: maxDay.total,
      total: totals.reduce((a, b) => a + b, 0),
    },
    today: {
      total: todayTotal,
      goalMet: goal ? todayTotal >= goal.dailyTarget : false,
      perType: todayPerType.sort((a, b) => b.total - a.total),
    },
    goal: goal ?? { dailyTarget: 100, isActive: true },
    streak: streak ?? { currentStreak: 0, longestStreak: 0 },
    allTime: { totalCount: user?.totalCount ?? 0, bestDay },
    perType: perType.sort((a, b) => b.total - a.total),
  };
}

export async function getGoal(userId: string): Promise<IZikrGoal> {
  let goal = await ZikrGoal.findOne({ userId });
  if (!goal) {
    goal = new ZikrGoal({ userId, dailyTarget: 100 });
    await goal.save();
  }
  return goal;
}

export async function setGoal(userId: string, dailyTarget: number): Promise<IZikrGoal> {
  let goal = await ZikrGoal.findOne({ userId });
  if (!goal) {
    goal = new ZikrGoal({ userId, dailyTarget });
  } else {
    goal.dailyTarget = dailyTarget;
    goal.isActive = true;
  }
  await goal.save();
  return goal;
}
