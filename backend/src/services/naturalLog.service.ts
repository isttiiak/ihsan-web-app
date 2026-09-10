import * as salatService from './salat.service.js';
import * as zikrService from './zikr.service.js';
import * as quranService from './quran.service.js';
import { PrayerId, PrayerLocation } from '../models/SalatLog.js';
import { DEFAULT_TIMEZONE_OFFSET } from '../utils/timezone-flexible.js';

export interface CommitSalatEntry {
  prayer: PrayerId;
  status: 'completed' | 'kaza';
  location?: PrayerLocation;
}
export interface CommitZikrEntry {
  typeName: string;
  count: number;
}
export interface CommitInput {
  salat: CommitSalatEntry[];
  zikr: CommitZikrEntry[];
  quranAyat: number | null;
  date?: string;
  timezoneOffset?: number;
}
export interface CommitResult {
  salatApplied: number;
  zikrApplied: number;
  quranApplied: boolean;
}

function todayDateString(): string {
  return new Date().toISOString().substring(0, 10);
}

/**
 * Applies an already-confirmed natural-language log across salat/zikr/quran
 * by reusing each domain's own write path — this is the exact same effect as
 * a user tapping each of those UIs by hand, just batched from one note. The
 * parse step (ai.service.ts's parseNaturalLog) never writes anything itself;
 * only this function, called after the user has reviewed/edited the preview.
 */
export async function commitNaturalLog(userId: string, input: CommitInput): Promise<CommitResult> {
  const date = input.date ?? todayDateString();

  for (const s of input.salat.slice(0, 5)) {
    await salatService.updatePrayerStatus(userId, s.prayer, s.status, date, s.location);
  }

  if (input.zikr.length) {
    await zikrService.batchIncrementZikr(
      userId,
      input.zikr.slice(0, 10).map((z) => ({ zikrType: z.typeName, amount: z.count })),
      input.timezoneOffset ?? DEFAULT_TIMEZONE_OFFSET
    );
  }

  let quranApplied = false;
  if (input.quranAyat && input.quranAyat > 0) {
    await quranService.addAyatReading(userId, { date, count: input.quranAyat });
    quranApplied = true;
  }

  return {
    salatApplied: input.salat.length,
    zikrApplied: input.zikr.length,
    quranApplied,
  };
}
