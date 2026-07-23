import User from '../models/User.js';
import ZikrDaily from '../models/ZikrDaily.js';
import ZikrGoal from '../models/ZikrGoal.js';
import SalatLog from '../models/SalatLog.js';
import FastingLog from '../models/FastingLog.js';
import FastingProfile from '../models/FastingProfile.js';
import QuranLog from '../models/QuranLog.js';
import QuranProfile from '../models/QuranProfile.js';
import CycleLog from '../models/CycleLog.js';
import CycleDay from '../models/CycleDay.js';
import CycleProfile from '../models/CycleProfile.js';

/**
 * Full-account backup & restore (Istiak's spec, v4.9): ONE JSON file that
 * carries every domain — the same file the import endpoint accepts.
 *
 * Restore semantics: MERGE with imported-wins. Docs are upserted by their
 * natural key (date / date+type / startDate), so importing an old backup
 * over fresh data overwrites only the days present in the file.
 */

export const BACKUP_VERSION = 1;

type PlainDoc = Record<string, unknown>;

/** Strip mongo internals so exported docs are portable + re-importable. */
function clean(doc: PlainDoc | null): PlainDoc | null {
  if (!doc) return null;
  const { _id, __v, userId, createdAt, updatedAt, ...rest } = doc as PlainDoc & {
    _id?: unknown; __v?: unknown; userId?: unknown; createdAt?: unknown; updatedAt?: unknown;
  };
  return rest;
}
const cleanAll = (docs: PlainDoc[]): PlainDoc[] => docs.map((d) => clean(d)!) as PlainDoc[];

/** Map keys may not contain "." or start with "$" (Mongo path rules). */
const safeKey = (k: string) => k.length > 0 && k.length <= 100 && !k.includes('.') && !k.startsWith('$');

export async function exportAll(uid: string): Promise<PlainDoc> {
  const [user, goal, zikrDaily, salat, fastingProfile, fastingLogs, quranProfile, quranLogs, cycleProfile, cycleLogs, cycleDays] =
    await Promise.all([
      User.findOne({ uid }).lean(),
      ZikrGoal.findOne({ userId: uid }).lean(),
      ZikrDaily.find({ userId: uid }).lean(),
      SalatLog.find({ userId: uid }).lean(),
      FastingProfile.findOne({ userId: uid }).lean(),
      FastingLog.find({ userId: uid }).lean(),
      QuranProfile.findOne({ userId: uid }).lean(),
      QuranLog.find({ userId: uid }).lean(),
      CycleProfile.findOne({ userId: uid }).lean(),
      CycleLog.find({ userId: uid }).lean(),
      CycleDay.find({ userId: uid }).lean(),
    ]);

  return {
    app: 'ihsan',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    user: user
      ? {
          displayName: user.displayName ?? null,
          email: user.email ?? null,
          gender: user.gender ?? null,
          birthDate: user.birthDate ?? null,
          country: (user as PlainDoc).country ?? null,
          photoUrl: user.photoUrl ?? null,
        }
      : null,
    zikr: {
      totalCount: user?.totalCount ?? 0,
      // .lean() turns the Map into a plain object already
      zikrTotals: (user?.zikrTotals as unknown as Record<string, number> | undefined) ?? {},
      zikrTypes: ((user?.zikrTypes ?? []) as unknown as Array<{ name: string }>).map((t) => ({ name: t.name })),
      goal: clean(goal as PlainDoc | null),
      daily: cleanAll(zikrDaily as PlainDoc[]),
    },
    salat: cleanAll(salat as PlainDoc[]),
    fasting: { profile: clean(fastingProfile as PlainDoc | null), logs: cleanAll(fastingLogs as PlainDoc[]) },
    quran: { profile: clean(quranProfile as PlainDoc | null), logs: cleanAll(quranLogs as PlainDoc[]) },
    // Rayhanah data ships only when it exists — and the file stays on the
    // user's own device; nothing here changes the no-leak API rules.
    ...(cycleProfile || cycleLogs.length || cycleDays.length
      ? {
          cycle: {
            profile: clean(cycleProfile as PlainDoc | null),
            logs: cleanAll(cycleLogs as PlainDoc[]),
            days: cleanAll(cycleDays as PlainDoc[]),
          },
        }
      : {}),
  };
}

export interface ImportCounts {
  zikrDays: number;
  salatDays: number;
  fastingDays: number;
  quranDays: number;
  cycleEntries: number;
}

export interface BackupFile {
  user?: PlainDoc | null;
  zikr?: {
    totalCount?: number;
    zikrTotals?: Record<string, number>;
    zikrTypes?: Array<{ name: string }>;
    goal?: PlainDoc | null;
    daily?: PlainDoc[];
  };
  salat?: PlainDoc[];
  fasting?: { profile?: PlainDoc | null; logs?: PlainDoc[] };
  quran?: { profile?: PlainDoc | null; logs?: PlainDoc[] };
  cycle?: { profile?: PlainDoc | null; logs?: PlainDoc[]; days?: PlainDoc[] };
}

export async function importAll(uid: string, data: BackupFile): Promise<ImportCounts> {
  const counts: ImportCounts = { zikrDays: 0, salatDays: 0, fastingDays: 0, quranDays: 0, cycleEntries: 0 };

  // ── User + zikr lifetime state ──
  const userSet: PlainDoc = {};
  if (data.user && typeof data.user === 'object') {
    for (const k of ['displayName', 'gender', 'birthDate', 'country', 'photoUrl'] as const) {
      if (data.user[k] !== undefined && data.user[k] !== null) userSet[k] = data.user[k];
    }
  }
  if (data.zikr) {
    if (typeof data.zikr.totalCount === 'number' && data.zikr.totalCount >= 0) userSet.totalCount = data.zikr.totalCount;
    if (data.zikr.zikrTotals && typeof data.zikr.zikrTotals === 'object') {
      userSet.zikrTotals = Object.fromEntries(
        Object.entries(data.zikr.zikrTotals).filter(([k, v]) => safeKey(k) && typeof v === 'number' && v >= 0)
      );
    }
    if (Array.isArray(data.zikr.zikrTypes)) {
      const names = [...new Set(
        data.zikr.zikrTypes
          .map((t) => (typeof t?.name === 'string' ? t.name.trim() : ''))
          .filter((n) => safeKey(n))
      )].slice(0, 200);
      if (names.length) userSet.zikrTypes = names.map((name) => ({ name }));
    }
  }
  if (Object.keys(userSet).length) await User.updateOne({ uid }, { $set: userSet });

  if (data.zikr?.goal && typeof data.zikr.goal === 'object') {
    const target = Number((data.zikr.goal as PlainDoc).dailyTarget);
    if (Number.isFinite(target) && target >= 1) {
      await ZikrGoal.updateOne({ userId: uid }, { $set: { dailyTarget: target, isActive: true } }, { upsert: true });
    }
  }

  // ── Per-day docs: replace-by-natural-key upserts (imported wins) ──
  if (Array.isArray(data.zikr?.daily) && data.zikr.daily.length) {
    const ops = data.zikr.daily
      .filter((d) => d && typeof d.zikrType === 'string' && safeKey(d.zikrType) && d.date && Number(d.count) >= 0)
      .slice(0, 20000)
      .map((d) => ({
        updateOne: {
          filter: { userId: uid, date: new Date(d.date as string), zikrType: d.zikrType as string },
          update: { $set: { count: Number(d.count) } },
          upsert: true,
        },
      }));
    if (ops.length) { await ZikrDaily.bulkWrite(ops); counts.zikrDays = ops.length; }
  }

  const replaceByDate = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Model: any,
    docs: PlainDoc[] | undefined,
    max = 5000
  ): Promise<number> => {
    if (!Array.isArray(docs) || !docs.length) return 0;
    const ops = docs
      .filter((d) => d && typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date))
      .slice(0, max)
      .map((d) => {
        const { _id, __v, userId, createdAt, updatedAt, ...rest } = d as PlainDoc & { _id?: unknown; __v?: unknown; userId?: unknown; createdAt?: unknown; updatedAt?: unknown };
        return { replaceOne: { filter: { userId: uid, date: d.date }, replacement: { ...rest, userId: uid, date: d.date }, upsert: true } };
      });
    if (ops.length) await Model.bulkWrite(ops);
    return ops.length;
  };

  counts.salatDays = await replaceByDate(SalatLog, data.salat);
  counts.fastingDays = await replaceByDate(FastingLog, data.fasting?.logs);
  counts.quranDays = await replaceByDate(QuranLog, data.quran?.logs);

  // ── Profiles: whole-object overwrite (sanitized) ──
  const setProfile = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Model: any,
    profile: PlainDoc | null | undefined
  ) => {
    if (!profile || typeof profile !== 'object') return;
    const { _id, __v, userId, createdAt, updatedAt, ...rest } = profile as PlainDoc & { _id?: unknown; __v?: unknown; userId?: unknown; createdAt?: unknown; updatedAt?: unknown };
    if (Object.keys(rest).length) await Model.updateOne({ userId: uid }, { $set: rest }, { upsert: true });
  };
  await setProfile(FastingProfile, data.fasting?.profile);
  await setProfile(QuranProfile, data.quran?.profile);

  // ── Rayhanah ──
  if (data.cycle) {
    await setProfile(CycleProfile, data.cycle.profile);
    if (Array.isArray(data.cycle.logs) && data.cycle.logs.length) {
      const ops = data.cycle.logs
        .filter((d) => d && typeof d.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.startDate as string))
        .slice(0, 2000)
        .map((d) => {
          const { _id, __v, userId, createdAt, updatedAt, ...rest } = d as PlainDoc & { _id?: unknown; __v?: unknown; userId?: unknown; createdAt?: unknown; updatedAt?: unknown };
          return { replaceOne: { filter: { userId: uid, startDate: d.startDate }, replacement: { ...rest, userId: uid, startDate: d.startDate }, upsert: true } };
        });
      if (ops.length) { await CycleLog.bulkWrite(ops as never); counts.cycleEntries += ops.length; }
    }
    counts.cycleEntries += await replaceByDate(CycleDay, data.cycle.days, 3000);
  }

  return counts;
}
