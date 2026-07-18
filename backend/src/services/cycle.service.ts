import CycleLog, { ICycleLog } from '../models/CycleLog.js';
import CycleProfile, { ICycleProfile } from '../models/CycleProfile.js';
import CycleDay, { ICycleDay } from '../models/CycleDay.js';

/**
 * Rayhanah Cycle — menstrual (hayd) & post-natal (nifas) tracking.
 *
 * Fiqh model (verified references live in the frontend education content):
 * - Salat during hayd/nifas is fully excused and never made up; missed
 *   Ramadan fasts ARE made up (Muslim 335).
 * - Everything else — dhikr, du'a, listening to Quran, knowledge, charity —
 *   remains open (Bukhari 305, Muslim 373).
 * - Bleeding beyond the madhab's maximum is istihada: prayer resumes with
 *   fresh wudu per prayer (Bukhari 306).
 */

export const HAYD_MAX: Record<ICycleProfile['madhab'], number> = {
  hanafi: 10,
  majority: 15,
};
export const NIFAS_MAX = 40; // Abu Dawud 311 (Shafi'i position of 60 noted in UI)

const DAY_STR_RE = /^\d{4}-\d{2}-\d{2}$/;

function shiftDateStr(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T12:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T12:00:00.000Z').getTime() - new Date(a + 'T12:00:00.000Z').getTime()) / 86_400_000
  );
}

export async function getOrCreateProfile(userId: string): Promise<ICycleProfile> {
  let profile = await CycleProfile.findOne({ userId });
  if (!profile) profile = await CycleProfile.create({ userId });
  return profile;
}

export async function setMadhab(userId: string, madhab: ICycleProfile['madhab']): Promise<ICycleProfile> {
  return await CycleProfile.findOneAndUpdate(
    { userId },
    { $set: { madhab } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export interface CycleStatus {
  active: {
    type: 'hayd' | 'nifas';
    startDate: string;
    dayCount: number;
    maxDays: number;
    /** true once dayCount exceeds maxDays — show istihada guidance */
    beyondMax: boolean;
  } | null;
  prediction: {
    nextStart: string | null;
    avgCycleDays: number;
    avgPeriodDays: number;
    basedOnCycles: number;
  };
  madhab: ICycleProfile['madhab'];
}

export async function getStatus(userId: string, today: string): Promise<CycleStatus> {
  const [profile, logs] = await Promise.all([
    getOrCreateProfile(userId),
    CycleLog.find({ userId }).sort({ startDate: -1 }).limit(13),
  ]);

  const activeLog = logs.find((l) => l.endDate === null && l.startDate <= today) ?? null;
  const maxDays = activeLog?.type === 'nifas' ? NIFAS_MAX : HAYD_MAX[profile.madhab];

  let active: CycleStatus['active'] = null;
  if (activeLog) {
    const dayCount = daysBetween(activeLog.startDate, today) + 1;
    active = {
      type: activeLog.type,
      startDate: activeLog.startDate,
      dayCount,
      maxDays,
      beyondMax: dayCount > maxDays,
    };
  }

  // Predictions from completed hayd episodes only (nifas is not cyclical)
  const hayd = logs.filter((l) => l.type === 'hayd').sort((a, b) => a.startDate.localeCompare(b.startDate));
  const gaps: number[] = [];
  for (let i = 1; i < hayd.length; i++) {
    const g = daysBetween(hayd[i - 1]!.startDate, hayd[i]!.startDate);
    if (g >= 15 && g <= 60) gaps.push(g); // ignore data-entry outliers
  }
  const lengths = hayd
    .filter((l) => l.endDate)
    .map((l) => daysBetween(l.startDate, l.endDate as string) + 1)
    .filter((n) => n >= 1 && n <= 15);

  const avgCycleDays = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 28;
  const avgPeriodDays = lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 7;
  const lastStart = hayd.length ? hayd[hayd.length - 1]!.startDate : null;
  const nextStart = !active && lastStart ? shiftDateStr(lastStart, avgCycleDays) : null;

  return {
    active,
    prediction: { nextStart, avgCycleDays, avgPeriodDays, basedOnCycles: gaps.length },
    madhab: profile.madhab,
  };
}

export interface CycleSummary extends CycleStatus {
  logs: Array<{ _id: string; type: string; startDate: string; endDate: string | null }>;
  /** Wellness notes for the last ~60 days (flow/symptoms/mood) */
  days: Array<{ date: string; flow: string | null; symptoms: string[]; mood: string | null }>;
}

export async function getSummary(userId: string, today: string): Promise<CycleSummary> {
  const daysSince = shiftDateStr(today, -60);
  const [status, logs, days] = await Promise.all([
    getStatus(userId, today),
    CycleLog.find({ userId }).sort({ startDate: -1 }).limit(12).select('type startDate endDate'),
    CycleDay.find({ userId, date: { $gte: daysSince, $lte: today } }).select('date flow symptoms mood'),
  ]);
  return {
    ...status,
    logs: logs.map((l) => ({
      _id: String(l._id),
      type: l.type,
      startDate: l.startDate,
      endDate: l.endDate,
    })),
    days: days.map((d) => ({ date: d.date, flow: d.flow, symptoms: d.symptoms, mood: d.mood })),
  };
}

export async function upsertDay(
  userId: string,
  input: { date: string; flow?: string | null; symptoms?: string[]; mood?: string | null }
): Promise<ICycleDay> {
  const set: Record<string, unknown> = {};
  if (input.flow !== undefined) set.flow = input.flow;
  if (input.symptoms !== undefined) set.symptoms = input.symptoms;
  if (input.mood !== undefined) set.mood = input.mood;
  return await CycleDay.findOneAndUpdate(
    { userId, date: input.date },
    { $set: set, $setOnInsert: { userId, date: input.date } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function startCycle(
  userId: string,
  date: string,
  type: 'hayd' | 'nifas'
): Promise<{ ok: boolean; error?: string; log?: ICycleLog }> {
  if (!DAY_STR_RE.test(date)) return { ok: false, error: 'Invalid date' };

  const open = await CycleLog.findOne({ userId, endDate: null });
  if (open) return { ok: false, error: 'A cycle is already active — end it first.' };

  // No overlap with a completed episode
  const overlapping = await CycleLog.findOne({
    userId,
    startDate: { $lte: date },
    endDate: { $gte: date },
  });
  if (overlapping) return { ok: false, error: 'That date is inside an already-logged cycle.' };

  const log = await CycleLog.create({ userId, type, startDate: date, endDate: null });
  return { ok: true, log };
}

export async function endCycle(
  userId: string,
  date: string
): Promise<{ ok: boolean; error?: string; log?: ICycleLog }> {
  if (!DAY_STR_RE.test(date)) return { ok: false, error: 'Invalid date' };

  const open = await CycleLog.findOne({ userId, endDate: null });
  if (!open) return { ok: false, error: 'No active cycle to end.' };
  if (date < open.startDate) return { ok: false, error: 'End date is before the start date.' };

  open.endDate = date;
  await open.save();
  return { ok: true, log: open };
}

export async function deleteLog(userId: string, logId: string): Promise<boolean> {
  const res = await CycleLog.deleteOne({ userId, _id: logId });
  return res.deletedCount > 0;
}

export async function deleteAll(userId: string): Promise<void> {
  await CycleLog.deleteMany({ userId });
  await CycleProfile.deleteMany({ userId });
  await CycleDay.deleteMany({ userId });
}

/**
 * Which of these users are excused (inside an active or logged episode) on
 * `date`? One query for the whole leaderboard. Used ONLY server-side for the
 * Noor substitution — the result must never appear in an API response.
 */
export async function getExcusedSet(userIds: string[], date: string): Promise<Set<string>> {
  if (!userIds.length) return new Set();
  const rows = await CycleLog.find({
    userId: { $in: userIds },
    startDate: { $lte: date },
    $or: [{ endDate: null }, { endDate: { $gte: date } }],
  }).select('userId');
  return new Set(rows.map((r) => r.userId));
}

/** All excused day-intervals for one user (for the all-time Noor walk). */
export async function getExcusedIntervals(
  userId: string
): Promise<Array<{ start: string; end: string | null }>> {
  const rows = await CycleLog.find({ userId }).select('startDate endDate');
  return rows.map((r) => ({ start: r.startDate, end: r.endDate }));
}
