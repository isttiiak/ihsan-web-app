import { z } from 'zod';

export const aiSuggestSchema = z.object({
  body: z.object({
    userSummary: z.string().max(500).optional(),
  }),
});

export const aiReflectSchema = z.object({
  body: z.object({
    surah: z.number().int().min(1).max(114),
    ayah: z.number().int().min(1).max(286),
    text: z.string().min(1).max(2000),
  }),
});

export const aiWeeklySchema = z.object({
  body: z.object({
    stats: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const aiSimplifySchema = z.object({
  body: z.object({
    text: z.string().min(1).max(8000),
    language: z.enum(['en', 'bn']).default('en'),
  }),
});
