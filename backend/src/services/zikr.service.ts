import User from '../models/User.js';
import ZikrDaily from '../models/ZikrDaily.js';
import { truncateToTimezone, DEFAULT_TIMEZONE_OFFSET } from '../utils/timezone-flexible.js';
import { ZikrIncrementItem } from '../types/api.types.js';

export interface IncrementResult {
  totalCount: number;
  zikrTotals: Record<string, number>;
}

// Fields needed by increment/summary paths. Excludes photoUrl (can be a large
// base64 data URL) so hot paths never drag it out of the database.
const ZIKR_PROJECTION = 'uid totalCount zikrTotals zikrTypes';

/**
 * Applies increments atomically with $inc so concurrent flushes from two
 * tabs/devices can't overwrite each other (the previous read-modify-write
 * via user.save() lost counts under concurrency).
 */
async function applyIncrements(
  userId: string,
  increments: ZikrIncrementItem[],
  timezoneOffset: number
): Promise<IncrementResult> {
  const userInc: Record<string, number> = {};
  const newTypeNames = new Set<string>();
  let totalAdded = 0;

  for (const item of increments) {
    const { zikrType, amount = 1, ts } = item;
    if (!zikrType || !Number.isFinite(amount) || amount <= 0) continue;

    const date = truncateToTimezone(ts ?? Date.now(), timezoneOffset);
    try {
      await ZikrDaily.updateOne(
        { userId, date, zikrType },
        { $inc: { count: amount } },
        { upsert: true }
      );
    } catch {
      // Ignore duplicate key race conditions
    }

    userInc[`zikrTotals.${zikrType}`] = (userInc[`zikrTotals.${zikrType}`] ?? 0) + amount;
    totalAdded += amount;
    newTypeNames.add(zikrType);
  }

  if (totalAdded > 0) {
    await User.updateOne(
      { uid: userId },
      { $inc: { ...userInc, totalCount: totalAdded } }
    );
  }

  const user = await User.findOne({ uid: userId }).select(ZIKR_PROJECTION);
  if (!user) throw new Error('User not found');

  // Register any brand-new type names (case-insensitive, deduped by pre-save hook)
  let typesChanged = false;
  for (const name of newTypeNames) {
    if (!user.zikrTypes.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      user.zikrTypes.push({ name } as never);
      typesChanged = true;
    }
  }
  if (typesChanged) await user.save();

  return {
    totalCount: user.totalCount,
    zikrTotals: Object.fromEntries(user.zikrTotals ?? []),
  };
}

export async function incrementZikr(
  userId: string,
  zikrType: string,
  amount: number,
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET,
  ts?: number
): Promise<IncrementResult> {
  return applyIncrements(userId, [{ zikrType, amount, ts }], timezoneOffset);
}

export async function batchIncrementZikr(
  userId: string,
  increments: ZikrIncrementItem[],
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET
): Promise<IncrementResult> {
  return applyIncrements(userId, increments, timezoneOffset);
}

export async function getZikrSummary(userId: string): Promise<{ totalCount: number; perType: Array<{ zikrType: string; total: number }>; types: unknown[] }> {
  const user = await User.findOne({ uid: userId }).select(ZIKR_PROJECTION);
  if (!user) throw new Error('User not found');

  let perType: Array<{ zikrType: string; total: number }> = [];
  if (user.zikrTotals instanceof Map) {
    perType = [...user.zikrTotals.entries()].map(([zikrType, total]) => ({ zikrType, total }));
  } else if (user.zikrTotals && typeof user.zikrTotals === 'object') {
    perType = Object.entries(user.zikrTotals as unknown as Record<string, number>).map(([zikrType, total]) => ({ zikrType, total }));
  }

  return {
    totalCount: user.totalCount ?? 0,
    perType: perType.sort((a, b) => b.total - a.total),
    types: user.zikrTypes,
  };
}

export async function getZikrTypes(userId: string): Promise<unknown[]> {
  const user = await User.findOne({ uid: userId }).select('zikrTypes');
  return user?.zikrTypes ?? [];
}

export async function addZikrType(userId: string, name: string): Promise<unknown[]> {
  const user = await User.findOne({ uid: userId }).select(ZIKR_PROJECTION);
  if (!user) throw new Error('User not found');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user.zikrTypes.some((t: any) => (t.name as string).toLowerCase() === name.toLowerCase())) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (user.zikrTypes as any).push({ name });
    await user.save();
  }
  return user.zikrTypes;
}

export async function deleteAllUserZikrData(userId: string): Promise<void> {
  // Delete all daily records
  await ZikrDaily.deleteMany({ userId });
  // Reset lifetime totals on User document
  await User.updateOne({ uid: userId }, { $set: { totalCount: 0, zikrTotals: {} } });
  // Reset streak (keep the doc, just zero it out)
  const ZikrStreak = (await import('../models/ZikrStreak.js')).default;
  await ZikrStreak.updateOne(
    { userId },
    { $set: { currentStreak: 0, longestStreak: 0, lastCompletedDate: null, isPaused: false } }
  );
}
