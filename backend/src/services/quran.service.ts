import QuranLog, { IQuranLog } from '../models/QuranLog.js';
import QuranProfile, { IQuranProfile, QURAN_TOTAL_PAGES } from '../models/QuranProfile.js';

function todayDateString(): string {
  return new Date().toISOString().substring(0, 10);
}

function shiftDateStr(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().substring(0, 10);
}

export async function getOrCreateProfile(userId: string): Promise<IQuranProfile> {
  let profile = await QuranProfile.findOne({ userId });
  if (!profile) profile = await QuranProfile.create({ userId });
  return profile;
}

export interface ReadResult {
  log: IQuranLog;
  profile: IQuranProfile;
  /** Set when this reading completed a khatm — the UI celebrates */
  khatmCompleted: boolean;
}

/**
 * Adds pages to the day's log (accumulating) and, when advancePosition is set,
 * moves the mushaf bookmark forward — completing a khatm when it crosses 604.
 */
export async function addReading(
  userId: string,
  date: string,
  pages: number,
  advancePosition: boolean
): Promise<ReadResult> {
  const log = await QuranLog.findOneAndUpdate(
    { userId, date },
    { $inc: { pages } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const profile = await getOrCreateProfile(userId);
  let khatmCompleted = false;

  if (advancePosition) {
    let pos = profile.currentPage + Math.round(pages);
    while (pos >= QURAN_TOTAL_PAGES) {
      pos -= QURAN_TOTAL_PAGES;
      profile.khatmCount += 1;
      khatmCompleted = true;
    }
    profile.currentPage = pos;
    await profile.save();
  }

  return { log, profile, khatmCompleted };
}

export interface QuranProfileUpdate {
  dailyGoalPages?: number;
  currentPage?: number;
}

export async function updateProfile(userId: string, input: QuranProfileUpdate): Promise<IQuranProfile> {
  const profile = await getOrCreateProfile(userId);
  if (input.dailyGoalPages !== undefined) profile.dailyGoalPages = input.dailyGoalPages;
  if (input.currentPage !== undefined) profile.currentPage = input.currentPage;
  await profile.save();
  return profile;
}

export interface QuranSummary {
  profile: {
    dailyGoalPages: number;
    currentPage: number;
    khatmCount: number;
    totalPages: number; // 604
  };
  todayPages: number;
  goalMet: boolean;
  streak: number;
  bestStreak: number;
  last7: Array<{ date: string; pages: number }>;
  stats: { last30Pages: number; allTimePages: number };
  /** Average pages/day over the last 7 days; null when no recent reading */
  pace: number | null;
  /** Estimated days to finish the current khatm at the current pace */
  estDaysToKhatm: number | null;
}

export async function getSummary(userId: string, today?: string): Promise<QuranSummary> {
  const end = today ?? todayDateString();
  const windowSince = shiftDateStr(end, -364);

  const [profile, logs, allTimeAgg] = await Promise.all([
    getOrCreateProfile(userId),
    QuranLog.find({ userId, date: { $gte: windowSince, $lte: end } }).select('date pages').sort({ date: 1 }),
    QuranLog.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$pages' } } },
    ]) as Promise<Array<{ _id: null; total: number }>>,
  ]);

  const byDate = new Map(logs.map((l) => [l.date, l.pages]));
  const todayPages = byDate.get(end) ?? 0;

  // Streak: consecutive days with any reading, ending today (or yesterday if
  // today hasn't been read yet — the day is still in progress).
  let streak = 0;
  let cursor = (byDate.get(end) ?? 0) > 0 ? end : shiftDateStr(end, -1);
  while ((byDate.get(cursor) ?? 0) > 0) {
    streak++;
    cursor = shiftDateStr(cursor, -1);
  }

  let bestStreak = 0;
  let run = 0;
  for (let i = 364; i >= 0; i--) {
    const d = shiftDateStr(end, -i);
    run = (byDate.get(d) ?? 0) > 0 ? run + 1 : 0;
    if (run > bestStreak) bestStreak = run;
  }

  const last7: Array<{ date: string; pages: number }> = [];
  let last7Sum = 0;
  for (let i = 6; i >= 0; i--) {
    const d = shiftDateStr(end, -i);
    const p = byDate.get(d) ?? 0;
    last7.push({ date: d, pages: p });
    last7Sum += p;
  }

  let last30Pages = 0;
  const since30 = shiftDateStr(end, -29);
  for (const l of logs) if (l.date >= since30) last30Pages += l.pages;

  const pace = last7Sum > 0 ? Math.round((last7Sum / 7) * 10) / 10 : null;
  const remaining = QURAN_TOTAL_PAGES - profile.currentPage;
  const estDaysToKhatm = pace && pace > 0 ? Math.ceil(remaining / pace) : null;

  return {
    profile: {
      dailyGoalPages: profile.dailyGoalPages,
      currentPage: profile.currentPage,
      khatmCount: profile.khatmCount,
      totalPages: QURAN_TOTAL_PAGES,
    },
    todayPages,
    goalMet: todayPages >= profile.dailyGoalPages,
    streak,
    bestStreak,
    last7,
    stats: {
      last30Pages,
      allTimePages: allTimeAgg[0]?.total ?? 0,
    },
    pace,
    estDaysToKhatm,
  };
}

export async function deleteAllUserQuranData(userId: string): Promise<{ deletedCount: number }> {
  const result = await QuranLog.deleteMany({ userId });
  await QuranProfile.deleteOne({ userId });
  return { deletedCount: result.deletedCount ?? 0 };
}
