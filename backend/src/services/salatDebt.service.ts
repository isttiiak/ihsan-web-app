import SalatDebt, { ISalatDebt } from '../models/SalatDebt.js';
import SalatDebtEvent from '../models/SalatDebtEvent.js';
import { PRAYER_IDS, PrayerId } from '../models/SalatLog.js';

export interface SalatDebtSummary {
  owed: Record<PrayerId, number>;
  totalOwed: number;
}

function todayDateString(): string {
  return new Date().toISOString().substring(0, 10);
}

const EMPTY_OWED = (): Record<PrayerId, number> =>
  Object.fromEntries(PRAYER_IDS.map((id) => [id, 0])) as Record<PrayerId, number>;

/**
 * Reads each field explicitly rather than spreading `doc.owed` — it is a
 * Mongoose subdocument, and its schema-defined fields live on prototype
 * getters, not as own enumerable properties. A spread instead copies the
 * subdocument's own internal bookkeeping props ($__, _doc, $isNew, ...).
 */
function toSummary(doc: ISalatDebt | null): SalatDebtSummary {
  const owed = EMPTY_OWED();
  if (doc?.owed) {
    for (const id of PRAYER_IDS) {
      const v = doc.owed[id];
      if (typeof v === 'number') owed[id] = v;
    }
  }
  const totalOwed = PRAYER_IDS.reduce((sum, id) => sum + owed[id], 0);
  return { owed, totalOwed };
}

/** Read-only fetch — never creates a row for a user who has no debt yet. */
export async function getDebtReadOnly(userId: string): Promise<SalatDebtSummary> {
  const doc = await SalatDebt.findOne({ userId });
  return toSummary(doc);
}

async function logEvent(userId: string, prayer: PrayerId, delta: number, date?: string): Promise<void> {
  if (delta === 0) return;
  await SalatDebtEvent.create({ userId, prayer, delta, date: date ?? todayDateString() });
}

/**
 * Add `delta` to one prayer's owed count, clamped at 0 so payback taps can
 * never go negative. Used both for the manual "+/-" controls and for the
 * automatic missed <-> non-missed transition hook in salat.service.ts.
 * `date` is the civil date the change belongs to (the prayer's own date for
 * the automatic hook, "today" for a manual tap) — recorded on the event log
 * so the debt history chart buckets it correctly, not by server clock.
 */
export async function adjustDebt(userId: string, prayer: PrayerId, delta: number, date?: string): Promise<SalatDebtSummary> {
  if (delta === 0) return getDebtReadOnly(userId);
  const before = await getDebtReadOnly(userId);
  const beforeVal = before.owed[prayer];
  const afterVal = Math.max(0, beforeVal + delta);
  const actualDelta = afterVal - beforeVal;
  const doc = await SalatDebt.findOneAndUpdate(
    { userId },
    { $set: { [`owed.${prayer}`]: afterVal } },
    { upsert: true, new: true }
  );
  await logEvent(userId, prayer, actualDelta, date);
  return toSummary(doc);
}

/** Absolute set — used for the one-time "how many do you estimate you owe" setup. */
export async function setDebt(userId: string, prayer: PrayerId, count: number, date?: string): Promise<SalatDebtSummary> {
  const before = await getDebtReadOnly(userId);
  const actualDelta = count - before.owed[prayer];
  const doc = await SalatDebt.findOneAndUpdate(
    { userId },
    { $set: { [`owed.${prayer}`]: count } },
    { upsert: true, new: true }
  );
  await logEvent(userId, prayer, actualDelta, date);
  return toSummary(doc);
}

export async function deleteDebt(userId: string): Promise<void> {
  await SalatDebt.deleteOne({ userId });
  await SalatDebtEvent.deleteMany({ userId });
}

/** Shift a YYYY-MM-DD date string by `delta` days (pure string math, no TZ). */
function shiftDateStr(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().substring(0, 10);
}

export interface SalatDebtHistoryWeek {
  weekStart: string;
  weekEnd: string;
  accumulated: number;
  paidBack: number;
}

/**
 * Weekly accumulation-vs-payback buckets for the debt chart — same 7-day,
 * last-12-weeks windowing as the mosque frequency trend, for visual
 * consistency between the two analytics charts.
 */
export async function getDebtHistory(userId: string, days: number, today?: string): Promise<SalatDebtHistoryWeek[]> {
  const end = today ?? todayDateString();
  const start = shiftDateStr(end, -(days - 1));
  const events = await SalatDebtEvent.find({ userId, date: { $gte: start, $lte: end } });

  const totalWeeks = Math.min(12, Math.ceil(days / 7));
  const weeks: SalatDebtHistoryWeek[] = [];
  for (let w = totalWeeks - 1; w >= 0; w--) {
    const weekEnd = shiftDateStr(end, -(w * 7));
    const weekStartRaw = shiftDateStr(weekEnd, -6);
    const weekStart = weekStartRaw < start ? start : weekStartRaw;
    let accumulated = 0;
    let paidBack = 0;
    for (const ev of events) {
      if (ev.date < weekStart || ev.date > weekEnd) continue;
      if (ev.delta > 0) accumulated += ev.delta;
      else paidBack += -ev.delta;
    }
    weeks.push({ weekStart, weekEnd, accumulated, paidBack });
  }
  return weeks;
}
