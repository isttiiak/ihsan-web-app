import SalatLog, {
  PRAYER_IDS,
  PrayerId,
  PrayerStatus,
  PrayerLocation,
} from '../models/SalatLog.js';

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
  date?: string,
  location?: PrayerLocation,
  tasbeeh?: boolean
) {
  const d = date ?? todayDateString();
  const log = await getOrCreateLog(userId, d);

  const entry = log.prayers[prayer];
  entry.status = status;
  entry.prayedAt = status !== 'pending' ? new Date() : undefined;

  if (status === 'completed' || status === 'kaza') {
    entry.location = location ?? 'home';
    entry.tasbeeh = tasbeeh ?? false;
  } else {
    // Clear sub-tags when resetting to missed/pending
    entry.location = undefined;
    entry.tasbeeh = false;
  }

  await log.save();
  return log;
}

export async function getSalatHistory(userId: string, days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  const sinceStr = since.toISOString().substring(0, 10);

  return SalatLog.find({ userId, date: { $gte: sinceStr } }).sort({ date: 1 });
}

export interface SalatAnalyticsResult {
  totalDays: number;
  totalPossiblePrayers: number;
  completedCount: number;  // completed (on time)
  kazaCount: number;       // completed but late
  missedCount: number;
  prayedTotal: number;     // completed + kaza (both count as "prayed")
  mosqueCount: number;
  jamaatCount: number;     // mosque + jamat
  homeCount: number;
  tasbeehCount: number;
  completionRate: number;  // (completed+kaza) / total possible * 100
  currentStreak: number;
  bestStreak: number;
  perPrayer: Record<string, {
    completed: number; kaza: number; missed: number; pending: number;
    mosque: number; jamat: number; tasbeeh: number;
  }>;
  last7Days: Array<{ date: string; completed: number; total: number }>;
  calendarData: Array<{ date: string; completed: number; total: number }>;
}

export async function getSalatAnalytics(userId: string, days: number): Promise<SalatAnalyticsResult> {
  // Fetch enough for calendar (up to 180 days) but compute stats for the requested period
  const calendarDays = Math.max(days, 90);
  const logs = await getSalatHistory(userId, calendarDays);

  const statsLogs = logs.filter((l) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days + 1);
    return l.date >= cutoff.toISOString().substring(0, 10);
  });

  let completedCount = 0;
  let kazaCount = 0;
  let missedCount = 0;
  let mosqueCount = 0;
  let jamaatCount = 0;
  let homeCount = 0;
  let tasbeehCount = 0;

  const perPrayer: SalatAnalyticsResult['perPrayer'] = {};
  for (const pid of PRAYER_IDS) {
    perPrayer[pid] = { completed: 0, kaza: 0, missed: 0, pending: 0, mosque: 0, jamat: 0, tasbeeh: 0 };
  }

  for (const log of statsLogs) {
    for (const pid of PRAYER_IDS) {
      const entry = log.prayers[pid];
      const s = entry?.status ?? 'pending';
      const loc = entry?.location;

      if (s === 'completed') { completedCount++; perPrayer[pid].completed++; }
      else if (s === 'kaza') { kazaCount++; perPrayer[pid].kaza++; }
      else if (s === 'missed') { missedCount++; perPrayer[pid].missed++; }
      else { perPrayer[pid].pending++; }

      if (s === 'completed' || s === 'kaza') {
        if (loc === 'mosque') { mosqueCount++; jamaatCount++; perPrayer[pid].mosque++; }
        else if (loc === 'jamat') { jamaatCount++; perPrayer[pid].jamat++; }
        else { homeCount++; }
        if (entry?.tasbeeh) { tasbeehCount++; perPrayer[pid].tasbeeh++; }
      }
    }
  }

  const totalDays = statsLogs.length;
  const totalPossiblePrayers = totalDays * 5;
  const prayedTotal = completedCount + kazaCount;

  // Build log map for streak + calendar calculations
  const logMap = new Map(logs.map((l) => [l.date, l]));
  const statsMap = new Map(statsLogs.map((l) => [l.date, l]));

  // Streak: consecutive days where all 5 prayers done (completed or kaza)
  const sortedDates = statsLogs.map((l) => l.date).sort();
  let bestStreak = 0;
  let runStreak = 0;

  for (const date of sortedDates) {
    const log = statsMap.get(date);
    const allDone = PRAYER_IDS.every((pid) => {
      const s = log?.prayers[pid]?.status;
      return s === 'completed' || s === 'kaza';
    });
    runStreak = allDone ? runStreak + 1 : 0;
    if (runStreak > bestStreak) bestStreak = runStreak;
  }

  // Current streak (from end of sorted dates)
  let currentStreak = 0;
  const today = todayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);
  const lastDate = sortedDates[sortedDates.length - 1];

  if (lastDate === today || lastDate === yesterdayStr) {
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const log = statsMap.get(sortedDates[i]);
      const allDone = PRAYER_IDS.every((pid) => {
        const s = log?.prayers[pid]?.status;
        return s === 'completed' || s === 'kaza';
      });
      if (!allDone) break;
      currentStreak++;
    }
  }

  // Last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    const log = logMap.get(dateStr);
    let done = 0;
    if (log) {
      for (const pid of PRAYER_IDS) {
        const s = log.prayers[pid]?.status;
        if (s === 'completed' || s === 'kaza') done++;
      }
    }
    last7Days.push({ date: dateStr, completed: done, total: 5 });
  }

  // Calendar data — all days fetched (up to 180)
  const calendarData = [];
  for (let i = calendarDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    const log = logMap.get(dateStr);
    let done = 0;
    if (log) {
      for (const pid of PRAYER_IDS) {
        const s = log.prayers[pid]?.status;
        if (s === 'completed' || s === 'kaza') done++;
        else if (s === 'missed') done += 0; // explicitly tracked but missed
      }
    }
    calendarData.push({ date: dateStr, completed: done, total: 5 });
  }

  const completionRate = totalPossiblePrayers > 0
    ? Math.round((prayedTotal / totalPossiblePrayers) * 100)
    : 0;

  return {
    totalDays,
    totalPossiblePrayers,
    completedCount,
    kazaCount,
    missedCount,
    prayedTotal,
    mosqueCount,
    jamaatCount,
    homeCount,
    tasbeehCount,
    completionRate,
    currentStreak,
    bestStreak,
    perPrayer,
    last7Days,
    calendarData,
  };
}
