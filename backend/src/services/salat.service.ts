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

const EMPTY_ENTRY = { status: 'pending' as PrayerStatus };

/**
 * Read-only fetch: returns the stored log or a virtual empty one WITHOUT
 * writing to the database. Previously every GET (e.g. browsing back through
 * past dates) created a permanent empty row per day viewed.
 */
export async function getLogReadOnly(userId: string, date?: string) {
  const d = date ?? todayDateString();
  const log = await SalatLog.findOne({ userId, date: d });
  if (log) {
    normaliseLegacyPrayers(log);
    return log;
  }
  return {
    _id: '',
    userId,
    date: d,
    prayers: {
      fajr: EMPTY_ENTRY, dhuhr: EMPTY_ENTRY, asr: EMPTY_ENTRY,
      maghrib: EMPTY_ENTRY, isha: EMPTY_ENTRY,
    },
    nafl: { completed: false, types: [] as NaflType[], rakat: 2 },
  };
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

/** Shift a YYYY-MM-DD date string by `delta` days (pure string math, no TZ). */
function shiftDateStr(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().substring(0, 10);
}

export async function getSalatHistory(userId: string, days: number, today?: string) {
  const end = today ?? todayDateString();
  const sinceStr = shiftDateStr(end, -(days - 1));
  return SalatLog.find({ userId, date: { $gte: sinceStr, $lte: end } }).sort({ date: 1 });
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

export async function getSalatAnalytics(userId: string, days: number, clientToday?: string): Promise<SalatAnalyticsResult> {
  // "Today" must come from the user's device — the server runs UTC, which is
  // a different calendar date than the user's for part of every day.
  const today = clientToday ?? todayDateString();
  const calendarDays = Math.max(days, 90);
  const logs = await getSalatHistory(userId, calendarDays, today);

  const statsCutoff = shiftDateStr(today, -(days - 1));
  const statsLogs = logs.filter((l) => l.date >= statsCutoff);

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

  const isAllDone = (date: string): boolean => {
    const log = logMap.get(date);
    if (!log) return false; // a day with no log breaks the streak
    return PRAYER_IDS.every((pid) => {
      const s = log.prayers[pid]?.status;
      return s === 'completed' || s === 'kaza';
    });
  };

  // Best streak: walk the window day by day so gap days (no log at all)
  // correctly break the run. The old version only iterated existing rows,
  // silently skipping missed days.
  let bestStreak = 0;
  let runStreak = 0;
  for (let i = 0; i < days; i++) {
    const date = shiftDateStr(statsCutoff, i);
    runStreak = isAllDone(date) ? runStreak + 1 : 0;
    if (runStreak > bestStreak) bestStreak = runStreak;
  }

  // Current streak: walk backwards from today. Today itself may be
  // incomplete (day in progress) — start from yesterday in that case.
  let currentStreak = 0;
  let cursor = isAllDone(today) ? today : shiftDateStr(today, -1);
  while (isAllDone(cursor)) {
    currentStreak++;
    cursor = shiftDateStr(cursor, -1);
  }

  const countDone = (dateStr: string): number => {
    const log = logMap.get(dateStr);
    if (!log) return 0;
    let done = 0;
    for (const pid of PRAYER_IDS) {
      const s = log.prayers[pid]?.status;
      if (s === 'completed' || s === 'kaza') done++;
    }
    return done;
  };

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = shiftDateStr(today, -i);
    last7Days.push({ date: dateStr, completed: countDone(dateStr), total: 5 });
  }

  const calendarData = [];
  for (let i = calendarDays - 1; i >= 0; i--) {
    const dateStr = shiftDateStr(today, -i);
    calendarData.push({ date: dateStr, completed: countDone(dateStr), total: 5 });
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

export async function deleteAllUserSalatLogs(userId: string): Promise<{ deletedCount: number }> {
  const result = await SalatLog.deleteMany({ userId });
  return { deletedCount: result.deletedCount ?? 0 };
}
