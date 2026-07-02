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
  }),
});
