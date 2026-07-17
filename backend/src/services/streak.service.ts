import ZikrDaily from '../models/ZikrDaily.js';
import ZikrGoal from '../models/ZikrGoal.js';
import ZikrStreak, { IZikrStreak } from '../models/ZikrStreak.js';
import { truncateToTimezone, DEFAULT_TIMEZONE_OFFSET } from '../utils/timezone-flexible.js';

/**
 * Streak rules (Istiak's spec, 2026-07-02):
 * - A day counts when its zikr total reaches the daily goal.
 * - Missing ONE day is a "grace" day — the streak survives if the next day is
 *   completed. Missing TWO consecutive days resets the streak to 0.
 * - Today is never a "miss" while it's still in progress.
 * - The streak is DERIVED from ZikrDaily buckets on every read, so
 *   backfilling a missed day (Log Missed Counts, up to 2 days back)
 *   reconnects the streak automatically.
 *
 * The ZikrStreak document is NOT a live counter. Its currentStreak +
 * lastCompletedDate pair acts only as a CREDIT ANCHOR written by
 * pause/resume (and by the legacy logic): if the derived chain walks back to
 * the anchor date without dying, the anchored streak is added on top. It is
 * never rewritten on ordinary reads — doing so would freeze over days that
 * the user can still backfill.
 */

export type StreakState = 'active' | 'grace' | 'none' | 'paused';

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  isPaused: boolean;
  state: StreakState;
  todayTotal: number;
  goalMet: boolean;
  dailyTarget: number;
}

const DAY_STR_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Bucket key: UTC date part equals the user's local date (see timezone-flexible). */
function keyOf(d: Date): string {
  return d.toISOString().split('T')[0] ?? '';
}

function shiftKey(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return keyOf(dt);
}

function keyToDate(key: string): Date {
  return new Date(key + 'T00:00:00.000Z');
}

async function loadDayTotals(userId: string, sinceKey: string): Promise<Map<string, number>> {
  const rows = await ZikrDaily.aggregate([
    { $match: { userId, date: { $gte: keyToDate(sinceKey) } } },
    { $group: { _id: '$date', total: { $sum: '$count' } } },
  ]) as Array<{ _id: Date; total: number }>;
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = keyOf(new Date(r._id));
    map.set(k, (map.get(k) ?? 0) + r.total);
  }
  return map;
}

/** Derives the live streak. Single source of truth for all streak reads. */
export async function getStreakStatus(
  userId: string,
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET,
  todayStr?: string
): Promise<StreakStatus> {
  const [goalDoc, doc] = await Promise.all([
    ZikrGoal.findOne({ userId }),
    ZikrStreak.findOne({ userId }),
  ]);
  const goal = goalDoc?.dailyTarget ?? 100;

  // Fajr-boundary tracking day: the client owns the day decision and sends it
  // explicitly; the clock+offset fallback keeps old clients working.
  const todayKey = todayStr && DAY_STR_RE.test(todayStr)
    ? todayStr
    : keyOf(truncateToTimezone(Date.now(), timezoneOffset));
  const yesterdayKey = shiftKey(todayKey, -1);
  const floorKey = shiftKey(todayKey, -365);

  // Credit anchor (from pause/resume or legacy data)
  const creditKey = doc?.lastCompletedDate ? keyOf(new Date(doc.lastCompletedDate)) : null;
  const credit = creditKey ? (doc?.currentStreak ?? 0) : 0;
  const sinceKey = creditKey && creditKey > floorKey ? creditKey : floorKey;

  const totals = await loadDayTotals(userId, sinceKey);
  const met = (k: string): boolean => (totals.get(k) ?? 0) >= goal;
  const todayTotal = totals.get(todayKey) ?? 0;
  const todayMet = todayTotal >= goal;

  if (doc?.isPaused) {
    return {
      currentStreak: doc.pausedStreak || doc.currentStreak || 0,
      longestStreak: doc.longestStreak ?? 0,
      isPaused: true,
      state: 'paused',
      todayTotal,
      goalMet: todayMet,
      dailyTarget: goal,
    };
  }

  // ── Walk back from yesterday, allowing single-day gaps ─────────────────────
  let streak = todayMet ? 1 : 0;

  if (creditKey === todayKey) {
    // Anchor covers today (legacy doc written earlier today) — trust it
    streak = Math.max(credit, streak);
  } else {
    let misses = 0;
    let cursor = yesterdayKey;
    for (let i = 0; i < 366; i++) {
      if (creditKey && cursor === creditKey) {
        // Chain reached the anchor alive → the anchored streak carries over
        streak += credit;
        break;
      }
      if (cursor < floorKey) break;
      if (met(cursor)) {
        streak++;
        misses = 0;
      } else {
        misses++;
        if (misses >= 2) break; // two consecutive missed days → chain dead
      }
      cursor = shiftKey(cursor, -1);
    }
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let state: StreakState;
  if (streak === 0) state = 'none';
  else if (todayMet) state = 'active';
  else if (met(yesterdayKey) || creditKey === yesterdayKey || creditKey === todayKey) state = 'active';
  else state = 'grace'; // yesterday missed — today is the last chance

  // Persist ONLY the longest-streak high-water mark (never the anchor pair)
  const longest = Math.max(doc?.longestStreak ?? 0, streak);
  if (doc && longest !== (doc.longestStreak ?? 0)) {
    doc.longestStreak = longest;
    await doc.save();
  } else if (!doc && streak > 0) {
    await ZikrStreak.create({ userId, longestStreak: longest, currentStreak: 0, lastCompletedDate: null });
  }

  return {
    currentStreak: streak,
    longestStreak: longest,
    isPaused: false,
    state,
    todayTotal,
    goalMet: todayMet,
    dailyTarget: goal,
  };
}

/**
 * Per-day statuses for a date range (used for the weekly heatmap tags).
 * met      — goal reached
 * pending  — today, goal not yet reached
 * grace    — missed, but the streak survived it (single-day gap)
 * missed   — missed and part of a broken chain (or plain miss)
 */
export function classifyDays(
  keys: string[],
  totals: Map<string, number>,
  goal: number,
  todayKey: string
): Record<string, 'met' | 'pending' | 'grace' | 'missed'> {
  const met = (k: string): boolean => (totals.get(k) ?? 0) >= goal;
  const out: Record<string, 'met' | 'pending' | 'grace' | 'missed'> = {};
  for (const k of keys) {
    if (met(k)) { out[k] = 'met'; continue; }
    if (k >= todayKey) { out[k] = 'pending'; continue; }
    const prevMet = met(shiftKey(k, -1));
    const nextKey = shiftKey(k, 1);
    const nextOk = met(nextKey) || nextKey === todayKey; // next day saved it, or it's today's chance
    out[k] = prevMet && nextOk ? 'grace' : 'missed';
  }
  return out;
}

// ─── Wrappers kept for existing callers ───────────────────────────────────────

export interface StreakCheckResult {
  goalMet: boolean;
  streak: {
    currentStreak: number;
    longestStreak: number;
    isPaused: boolean;
    state: StreakState;
  };
  todayTotal: number;
}

export async function checkAndUpdateStreak(
  userId: string,
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET,
  todayStr?: string
): Promise<StreakCheckResult | null> {
  try {
    const s = await getStreakStatus(userId, timezoneOffset, todayStr);
    return {
      goalMet: s.goalMet,
      streak: {
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        isPaused: s.isPaused,
        state: s.state,
      },
      todayTotal: s.todayTotal,
    };
  } catch (err) {
    console.error('Error checking streak:', err);
    return null;
  }
}

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  isPaused: boolean;
  state: StreakState;
}

export async function getStreak(
  userId: string,
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET,
  todayStr?: string
): Promise<StreakResponse> {
  const s = await getStreakStatus(userId, timezoneOffset, todayStr);
  return {
    currentStreak: s.currentStreak,
    longestStreak: s.longestStreak,
    isPaused: s.isPaused,
    state: s.state,
  };
}

export async function pauseStreak(
  userId: string,
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET,
  todayStr?: string
): Promise<{ ok: boolean; message: string; streak: IZikrStreak }> {
  // Freeze the DERIVED streak (the stored counter may be stale)
  const derived = await getStreakStatus(userId, timezoneOffset, todayStr);
  let streak = await ZikrStreak.findOne({ userId });
  if (!streak) streak = new ZikrStreak({ userId });

  if (streak.isPaused) {
    return { ok: false, message: 'Already paused', streak };
  }
  streak.isPaused = true;
  streak.pausedAt = new Date();
  streak.pausedStreak = derived.currentStreak;
  await streak.save();
  return { ok: true, message: 'Streak paused', streak };
}

export async function resumeStreak(
  userId: string,
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET,
  todayStr?: string
): Promise<{ ok: boolean; message: string; streak: IZikrStreak } | null> {
  const streak = await ZikrStreak.findOne({ userId });
  if (!streak) return null;
  if (!streak.isPaused) {
    return { ok: false, message: 'Not paused', streak };
  }

  // Write the frozen streak as a credit anchored at yesterday so today's
  // zikr seamlessly continues it.
  const todayKey = todayStr && DAY_STR_RE.test(todayStr)
    ? todayStr
    : keyOf(truncateToTimezone(Date.now(), timezoneOffset));
  streak.isPaused = false;
  streak.currentStreak = streak.pausedStreak;
  streak.lastCompletedDate = keyToDate(shiftKey(todayKey, -1));
  streak.pausedAt = null;
  streak.pausedStreak = 0;
  await streak.save();
  return { ok: true, message: 'Streak resumed', streak };
}
