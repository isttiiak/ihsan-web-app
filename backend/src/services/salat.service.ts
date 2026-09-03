import SalatLog, {
  PRAYER_IDS,
  NAFL_TYPE_IDS,
  PrayerId,
  PrayerStatus,
  PrayerLocation,
  NaflType,
} from '../models/SalatLog.js';
import * as salatDebtService from './salatDebt.service.js';

export function todayDateString(): string {
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
    log.nafl.types = (log.nafl.types as string[]).filter((t) =>
      VALID_NAFL_TYPES.has(t)
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
      fajr: EMPTY_ENTRY,
      dhuhr: EMPTY_ENTRY,
      asr: EMPTY_ENTRY,
      maghrib: EMPTY_ENTRY,
      isha: EMPTY_ENTRY,
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
  const wasMissed = entry.status === 'missed';
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

  // Keep the kaza-debt counter in sync with explicit 'missed' taps only —
  // a past day that was simply never logged does not silently add debt,
  // matching how missedCount in analytics already works.
  const isMissed = status === 'missed';
  if (wasMissed && !isMissed) await salatDebtService.adjustDebt(userId, prayer, -1, d);
  else if (!wasMissed && isMissed) await salatDebtService.adjustDebt(userId, prayer, 1, d);

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
  fridayCount: number;
  jumuahAttendedCount: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  perPrayer: Record<
    string,
    {
      completed: number;
      kaza: number;
      missed: number;
      pending: number;
      mosque: number;
      jamat: number;
      tasbeeh: number;
      currentStreak: number;
      bestStreak: number;
    }
  >;
  last7Days: Array<{ date: string; completed: number; total: number }>;
  calendarData: Array<{ date: string; completed: number; total: number }>;
  weeklyMosqueTrend: Array<{
    weekStart: string;
    weekEnd: string;
    mosqueCount: number;
    prayedCount: number;
    rate: number;
  }>;
}

export async function getSalatAnalytics(
  userId: string,
  days: number,
  clientToday?: string,
  resetDate?: string
): Promise<SalatAnalyticsResult> {
  const today = clientToday ?? todayDateString();
  const calendarDays = Math.max(days, 90);
  const logs = await getSalatHistory(userId, calendarDays, today);

  const rawCutoff = shiftDateStr(today, -(days - 1));
  const statsCutoff = resetDate && resetDate > rawCutoff ? resetDate : rawCutoff;

  // Full window: all dates from statsCutoff to today (inclusive), whether or
  // not the user created a log row for them. A day with no row = 5 pending
  // prayers; on past days those count as missed. This gives an honest picture
  // of prayers skipped, not just prayers explicitly marked.
  const effectiveDays = Math.max(
    1,
    Math.round(
      (new Date(today + 'T12:00:00').getTime() - new Date(statsCutoff + 'T12:00:00').getTime()) /
        86_400_000
    ) + 1
  );

  const logMap = new Map(logs.map((l) => [l.date, l]));

  let completedCount = 0;
  let kazaCount = 0;
  let missedCount = 0;
  let mosqueCount = 0;
  let jamaatCount = 0;
  let homeCount = 0;
  let tasbeehCount = 0;
  let naflDays = 0;
  let fridayCount = 0;
  let jumuahAttendedCount = 0;

  const perPrayer: SalatAnalyticsResult['perPrayer'] = {};
  for (const pid of PRAYER_IDS) {
    perPrayer[pid] = {
      completed: 0,
      kaza: 0,
      missed: 0,
      pending: 0,
      mosque: 0,
      jamat: 0,
      tasbeeh: 0,
      currentStreak: 0,
      bestStreak: 0,
    };
  }

  // Iterate every date in the analytics window. Unlogged past days count as 5
  // missed prayers. Pending prayers on past logged days also count as missed.
  for (let i = 0; i < effectiveDays; i++) {
    const dateStr = shiftDateStr(statsCutoff, i);
    const isPast = dateStr < today;
    const log = logMap.get(dateStr);

    if (!log) {
      // No log row for this date. Past days = fully missed; today = all pending.
      if (isPast) {
        missedCount += 5;
        for (const pid of PRAYER_IDS) perPrayer[pid].missed++;
      }
      // (today with no log: 5 pending — don't count against completion)
      continue;
    }

    for (const pid of PRAYER_IDS) {
      const entry = log.prayers[pid];
      const s = entry?.status ?? 'pending';
      const loc = entry?.location;
      // On past days, an unresolved pending prayer counts as missed.
      const effective = s === 'pending' && isPast ? 'missed' : s;

      if (effective === 'completed') {
        completedCount++;
        perPrayer[pid].completed++;
      } else if (effective === 'kaza') {
        kazaCount++;
        perPrayer[pid].kaza++;
      } else if (effective === 'missed') {
        missedCount++;
        perPrayer[pid].missed++;
      } else {
        perPrayer[pid].pending++;
      }

      if (effective === 'completed' || effective === 'kaza') {
        if (loc === 'mosque') {
          mosqueCount++;
          jamaatCount++;
          perPrayer[pid].mosque++;
        } else if (loc === 'jamat') {
          jamaatCount++;
          perPrayer[pid].jamat++;
        } else {
          homeCount++;
        }
        if (entry?.tasbeeh) {
          tasbeehCount++;
          perPrayer[pid].tasbeeh++;
        }
      }
    }
    if (log.nafl?.completed) naflDays++;

    // Jumu'ah — Friday's Dhuhr, prayed specifically at the mosque.
    if (new Date(dateStr + 'T12:00:00').getDay() === 5) {
      fridayCount++;
      const dhuhr = log.prayers.dhuhr;
      if (
        (dhuhr?.status === 'completed' || dhuhr?.status === 'kaza') &&
        dhuhr.location === 'mosque'
      ) {
        jumuahAttendedCount++;
      }
    }
  }

  const totalDays = effectiveDays;
  const totalPossiblePrayers = totalDays * 5;
  const prayedTotal = completedCount + kazaCount;

  const isAllDone = (date: string): boolean => {
    const log = logMap.get(date);
    if (!log) return false; // a day with no log breaks the streak
    return PRAYER_IDS.every((pid) => {
      const s = log.prayers[pid]?.status;
      return s === 'completed' || s === 'kaza';
    });
  };

  let bestStreak = 0;
  let runStreak = 0;
  for (let i = 0; i < effectiveDays; i++) {
    const date = shiftDateStr(statsCutoff, i);
    runStreak = isAllDone(date) ? runStreak + 1 : 0;
    if (runStreak > bestStreak) bestStreak = runStreak;
  }

  let currentStreak = 0;
  let cursor = isAllDone(today) ? today : shiftDateStr(today, -1);
  while (isAllDone(cursor) && cursor >= statsCutoff) {
    currentStreak++;
    cursor = shiftDateStr(cursor, -1);
  }

  // Per-prayer streaks — same best/current-run logic as the all-5 streak
  // above, but for one prayer at a time (e.g. "42-day Fajr streak").
  const isPrayerDone = (pid: PrayerId, date: string): boolean => {
    const log = logMap.get(date);
    if (!log) return false;
    const s = log.prayers[pid]?.status;
    return s === 'completed' || s === 'kaza';
  };
  for (const pid of PRAYER_IDS) {
    let pBest = 0;
    let pRun = 0;
    for (let i = 0; i < effectiveDays; i++) {
      const date = shiftDateStr(statsCutoff, i);
      pRun = isPrayerDone(pid, date) ? pRun + 1 : 0;
      if (pRun > pBest) pBest = pRun;
    }
    let pCurrent = 0;
    let pCursor = isPrayerDone(pid, today) ? today : shiftDateStr(today, -1);
    while (isPrayerDone(pid, pCursor) && pCursor >= statsCutoff) {
      pCurrent++;
      pCursor = shiftDateStr(pCursor, -1);
    }
    perPrayer[pid].currentStreak = pCurrent;
    perPrayer[pid].bestStreak = pBest;
  }

  // Weekly mosque attendance trend — 7-day buckets ending "today", oldest
  // first, capped at the last 12 weeks so a 1-year view doesn't render 52 bars.
  const weeklyMosqueTrend: SalatAnalyticsResult['weeklyMosqueTrend'] = [];
  const totalWeeks = Math.min(12, Math.ceil(effectiveDays / 7));
  for (let w = totalWeeks - 1; w >= 0; w--) {
    const weekEnd = shiftDateStr(today, -(w * 7));
    const weekStart = shiftDateStr(weekEnd, -6);
    const clampedStart = weekStart < statsCutoff ? statsCutoff : weekStart;
    let weekMosque = 0;
    let weekPrayed = 0;
    for (let d = clampedStart; d <= weekEnd; d = shiftDateStr(d, 1)) {
      const log = logMap.get(d);
      if (!log) continue;
      for (const pid of PRAYER_IDS) {
        const entry = log.prayers[pid];
        if (entry?.status === 'completed' || entry?.status === 'kaza') {
          weekPrayed++;
          if (entry.location === 'mosque') weekMosque++;
        }
      }
    }
    weeklyMosqueTrend.push({
      weekStart: clampedStart,
      weekEnd,
      mosqueCount: weekMosque,
      prayedCount: weekPrayed,
      rate: weekPrayed > 0 ? Math.round((weekMosque / weekPrayed) * 100) : 0,
    });
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

  const completionRate =
    totalPossiblePrayers > 0 ? Math.round((prayedTotal / totalPossiblePrayers) * 100) : 0;

  return {
    periodDays: days, // the originally-requested window (before reset clamp)
    totalDays, // actual days counted = effectiveDays (after reset clamp)
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
    fridayCount,
    jumuahAttendedCount,
    completionRate,
    currentStreak,
    bestStreak,
    perPrayer,
    last7Days,
    calendarData,
    weeklyMosqueTrend,
  };
}

export interface JourneyPhase {
  index: number;
  from: string; // inclusive start date (YYYY-MM-DD)
  to: string | null; // inclusive end date, null = ongoing
  days: number;
  done: number; // completed + kaza
  missed: number;
  kaza: number;
  completionRate: number;
  resetNote: string | null;
}

export async function getSalatJourney(
  userId: string,
  userCreatedAt: Date,
  resetHistory: Array<{ date: string; note: string }>,
  today: string
): Promise<JourneyPhase[]> {
  const accountStart = userCreatedAt.toISOString().substring(0, 10);

  // Build phase windows: [accountStart, r0), [r0, r1), …, [rN, today]
  const resets = [...resetHistory].sort((a, b) => a.date.localeCompare(b.date));
  const boundaries: string[] = [accountStart, ...resets.map((r) => r.date)];

  const phases: JourneyPhase[] = [];
  for (let i = 0; i < boundaries.length; i++) {
    const from = boundaries[i]!;
    const to = i < boundaries.length - 1 ? shiftDateStr(boundaries[i + 1]!, -1) : null;
    const phaseEnd = to ?? today;
    if (from > today) continue; // skip future phases

    const dayCount = Math.max(
      0,
      Math.round(
        (new Date(phaseEnd + 'T12:00:00').getTime() - new Date(from + 'T12:00:00').getTime()) /
          86_400_000
      ) + 1
    );

    // Reuse existing analytics — pass `from` as the resetDate so it acts as cutoff
    const stats = await getSalatAnalytics(userId, Math.max(1, dayCount), phaseEnd, from);
    const resetNote = i < resets.length ? resets[i]!.note || null : null;

    phases.push({
      index: i,
      from,
      to,
      days: stats.totalDays,
      done: stats.prayedTotal,
      missed: stats.missedCount,
      kaza: stats.kazaCount,
      completionRate: stats.completionRate,
      resetNote,
    });
  }

  return phases.reverse(); // newest first
}

export async function deleteAllUserSalatLogs(userId: string): Promise<{ deletedCount: number }> {
  const result = await SalatLog.deleteMany({ userId });
  await salatDebtService.deleteDebt(userId);
  return { deletedCount: result.deletedCount ?? 0 };
}
