import SalatDebt, { ISalatDebt } from '../models/SalatDebt.js';
import { PRAYER_IDS, PrayerId } from '../models/SalatLog.js';

export interface SalatDebtSummary {
  owed: Record<PrayerId, number>;
  totalOwed: number;
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

/**
 * Atomically add `delta` to one prayer's owed count, clamped at 0 so payback
 * taps can never go negative. Used both for the manual "+/-" controls and for
 * the automatic missed <-> non-missed transition hook in salat.service.ts.
 */
export async function adjustDebt(userId: string, prayer: PrayerId, delta: number): Promise<SalatDebtSummary> {
  if (delta === 0) return getDebtReadOnly(userId);
  const field = `owed.${prayer}`;
  const doc = await SalatDebt.findOneAndUpdate(
    { userId },
    [{ $set: { [field]: { $max: [0, { $add: [{ $ifNull: [`$${field}`, 0] }, delta] }] } } }],
    { upsert: true, new: true }
  );
  return toSummary(doc);
}

/** Absolute set — used for the one-time "how many do you estimate you owe" setup. */
export async function setDebt(userId: string, prayer: PrayerId, count: number): Promise<SalatDebtSummary> {
  const doc = await SalatDebt.findOneAndUpdate(
    { userId },
    { $set: { [`owed.${prayer}`]: count } },
    { upsert: true, new: true }
  );
  return toSummary(doc);
}

export async function deleteDebt(userId: string): Promise<void> {
  await SalatDebt.deleteOne({ userId });
}
