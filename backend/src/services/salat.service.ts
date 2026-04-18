import SalatLog, {
  PRAYER_IDS,
  NAFL_TYPE_IDS,
  PrayerId,
  PrayerStatus,
  PrayerLocation,
  NaflType,
} from '../models/SalatLog.js';

function todayDateString(): string {
  return new Date().toISOString().substring(0, 10);
}

const VALID_STATUSES = new Set<string>(['completed', 'kaza', 'missed', 'pending']);
const VALID_LOCATIONS = new Set<string>(['home', 'mosque', 'jamat']);
const VALID_NAFL_TYPES = new Set<string>(NAFL_TYPE_IDS);

/** Migrate legacy enum values written by older schema versions */
function normaliseLegacyPrayers(log: InstanceType<typeof SalatLog>) {
  for (const pid of PRAYER_IDS) {
    const entry = log.prayers[pid];
    if (!entry) continue;
    const s = entry.status as string;
    if (!VALID_STATUSES.has(s)) {
      entry.status = 'completed';
    }
    const loc = entry.location as string | undefined;
    if (loc !== undefined && !VALID_LOCATIONS.has(loc)) {
      entry.location = 'home';
    }
  }
  // Normalise nafl types array too
  if (log.nafl?.types) {
    log.nafl.types = (log.nafl.types as string[]).filter(
      (t) => VALID_NAFL_TYPES.has(t)
    ) as NaflType[];
  }
}

export async function getOrCreateLog(userId: string, date?: string) {
  const d = date ?? todayDateString();
  let log = await SalatLog.findOne({ userId, date: d });
  if (!log) {
    log = await SalatLog.create({ userId, date: d });
  } else {
    normaliseLegacyPrayers(log);
  }
  return log;
}

export async function updatePrayerStatus(
  userId: string,
  prayer: PrayerId,
  status: PrayerStatus,
  date?: string,
  location?: PrayerLocation,
  tasbeeh?: boolean,
  ayatulKursi?: boolean
) {
  const d = date ?? todayDateString();
  const log = await getOrCreateLog(userId, d);

  const entry = log.prayers[prayer];
  entry.status = status;
  entry.prayedAt = status !== 'pending' ? new Date() : undefined;

  if (status === 'completed' || status === 'kaza') {
    entry.location = location ?? 'home';
    entry.tasbeeh = tasbeeh ?? false;
    entry.ayatulKursi = ayatulKursi ?? false;
  } else {
    entry.location = undefined;
    entry.tasbeeh = false;
    entry.ayatulKursi = false;
  }

  await log.save();
  return log;
}

export async function updateNafl(
  userId: string,
  completed: boolean,
  types: NaflType[],
  rakat: number,
  date?: string
) {
  const d = date ?? todayDateString();
  const log = await getOrCreateLog(userId, d);

  log.nafl = {
    completed,
    types,
    rakat: Math.max(2, rakat),
    completedAt: completed ? new Date() : undefined,
  };

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
  periodDays: number;
  totalDays: number;
  totalPossiblePrayers: number;
  completedCount: number;
  kazaCount: number;
  missedCount: number;
  prayedTotal: number;
  mosqueCount: number;
  jamaatCount: number;
  homeCount: number;
  tasbeehCount: number;
  naflDays: number;
  completionRate: number;
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
  let naflDays = 0;

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
    if (log.nafl?.completed) naflDays++;
  }

  const totalDays = statsLogs.length;
  const totalPossiblePrayers = totalDays * 5;
  const prayedTotal = completedCount + kazaCount;

  const logMap = new Map(logs.map((l) => [l.date, l]));
  const statsMap = new Map(statsLogs.map((l) => [l.date, l]));

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
      }
    }
    calendarData.push({ date: dateStr, completed: done, total: 5 });
  }

  const completionRate = totalPossiblePrayers > 0
    ? Math.round((prayedTotal / totalPossiblePrayers) * 100)
    : 0;

  return {
    periodDays: days,
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
    naflDays,
    completionRate,
    currentStreak,
    bestStreak,
    perPrayer,
    last7Days,
    calendarData,
  };
}
