import { z } from 'zod';

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const quranReadSchema = z.object({
  body: z.object({
    date: dateStr,
    // Half pages allowed; bounded so a typo can't corrupt stats
    pages: z.number().min(0.5).max(604),
    advancePosition: z.boolean().default(true),
  }),
});

export const quranSummarySchema = z.object({
  query: z.object({
    today: dateStr.optional(),
  }),
  body: z.object({}).optional(),
});

export const quranProfileSchema = z.object({
  body: z.object({
    dailyGoalPages: z.number().int().min(1).max(604).optional(),
    currentPage: z.number().int().min(0).max(603).optional(),
    dailyGoalAyat: z.number().int().min(1).max(6236).optional(),
    currentAyah: z.number().int().min(0).max(6235).optional(),
  }),
});

export const quranReadAyatSchema = z.object({
  body: z.object({
    date: dateStr,
    // count 0 is allowed only to carry a pure surah-completion signal
    count: z.number().int().min(0).max(700),
    surah: z.number().int().min(1).max(114).optional(),
    advanceKhatm: z.boolean().default(false),
    /** Set when this reading reached the LAST ayah of `surah` — credits a
     * completion toward the "top surahs" list. */
    completedSurah: z.boolean().default(false),
  }),
});

export const quranBookmarkSchema = z.object({
  body: z.object({
    surah: z.number().int().min(1).max(114),
    ayah: z.number().int().min(1).max(286),
  }),
});

export const quranHistorySchema = z.object({
  query: z.object({
    days: z.coerce.number().int().min(1).max(365).default(30),
    today: dateStr.optional(),
  }),
  body: z.object({}).optional(),
});
