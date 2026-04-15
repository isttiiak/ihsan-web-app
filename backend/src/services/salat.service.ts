import SalatLog, { PRAYER_IDS, PrayerId, PrayerStatus } from '../models/SalatLog.js';

function todayDateString(): string {
  return new Date().toISOString().substring(0, 10);
}

export async function getOrCreateLog(userId: string, date?: string) {
  const d = date ?? todayDateString();
  let log = await SalatLog.findOne({ userId, date: d });
  if (!log) {
    log = await SalatLog.create({ userId, date: d });
  }
  return log;
}

export async function updatePrayerStatus(
  userId: string,
  prayer: PrayerId,
  status: PrayerStatus,
  date?: string
) {
  const d = date ?? todayDateString();
  const log = await getOrCreateLog(userId, d);
  log.prayers[prayer] = { status, loggedAt: status !== 'pending' ? new Date() : undefined };
  await log.save();
  return log;
}

export async function getSalatHistory(userId: string, days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  const sinceStr = since.toISOString().substring(0, 10);

  const logs = await SalatLog.find({
    userId,
    date: { $gte: sinceStr },
  }).sort({ date: 1 });

  return logs;
}

export interface SalatAnalyticsResult {
  totalDays: number;
  totalPrayers: number;
  prayedCount: number;
  mosqueCount: number;
  kazaCount: number;
  missedCount: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  perPrayer: Record<string, { prayed: number; mosque: number; kaza: number; missed: number }>;
  last7Days: Array<{ date: string; completed: number; total: number }>;
}

export async function getSalatAnalytics(userId: string, days: number): Promise<SalatAnalyticsResult> {
  const logs = await getSalatHistory(userId, days);

  let prayedCount = 0;
  let mosqueCount = 0;
  let kazaCount = 0;
  let missedCount = 0;
  const perPrayer: Record<string, { prayed: number; mosque: number; kaza: number; missed: number }> = {};

  for (const pid of PRAYER_IDS) {
    perPrayer[pid] = { prayed: 0, mosque: 0, kaza: 0, missed: 0 };
  }

  for (const log of logs) {
    for (const pid of PRAYER_IDS) {
      const s = log.prayers[pid]?.status ?? 'pending';
      if (s === 'prayed') { prayedCount++; perPrayer[pid].prayed++; }
      else if (s === 'mosque') { mosqueCount++; perPrayer[pid].mosque++; }
      else if (s === 'kaza') { kazaCount++; perPrayer[pid].kaza++; }
      else if (s === 'missed') { missedCount++; perPrayer[pid].missed++; }
    }
  }

  const totalDays = logs.length;
  const totalPrayers = totalDays * 5;

  // Streak: count consecutive days (ending today) where all 5 prayers were prayed/mosque
  const logMap = new Map(logs.map((l) => [l.date, l]));
  let currentStreak = 0;
  let bestStreak = 0;
  let streak = 0;
  const sortedDates = logs.map((l) => l.date).sort();

  for (const date of sortedDates) {
    const log = logMap.get(date);
    if (!log) { streak = 0; continue; }
    const allDone = PRAYER_IDS.every((pid) => {
      const s = log.prayers[pid]?.status;
      return s === 'prayed' || s === 'mosque';
    });
    streak = allDone ? streak + 1 : 0;
    if (streak > bestStreak) bestStreak = streak;
  }

  // Verify current streak ends at today or yesterday
  const today = todayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);
  const lastDate = sortedDates[sortedDates.length - 1];
  if (lastDate !== today && lastDate !== yesterdayStr) {
    currentStreak = 0;
  } else {
    // Re-compute from end
    currentStreak = 0;
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const log = logMap.get(sortedDates[i]);
      if (!log) break;
      const allDone = PRAYER_IDS.every((pid) => {
        const s = log.prayers[pid]?.status;
        return s === 'prayed' || s === 'mosque';
      });
      if (!allDone) break;
      currentStreak++;
    }
  }

  // Last 7 days summary
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    const log = logMap.get(dateStr);
    let completed = 0;
    if (log) {
      for (const pid of PRAYER_IDS) {
        const s = log.prayers[pid]?.status;
        if (s === 'prayed' || s === 'mosque') completed++;
      }
    }
    last7Days.push({ date: dateStr, completed, total: 5 });
  }

  const completionRate = totalPrayers > 0
    ? Math.round(((prayedCount + mosqueCount) / totalPrayers) * 100)
    : 0;

  return {
    totalDays,
    totalPrayers,
    prayedCount,
    mosqueCount,
    kazaCount,
    missedCount,
    completionRate,
    currentStreak,
    bestStreak,
    perPrayer,
    last7Days,
  };
}
