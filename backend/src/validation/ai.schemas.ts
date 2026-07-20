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

export const aiComebackSchema = z.object({
  body: z.object({
    daysAway: z.number().int().min(1).max(3650),
    bestStreak: z.number().int().min(0).max(10000).optional(),
  }),
});

export const aiComfortSchema = z.object({
  body: z.object({
    moods: z.array(z.enum(['calm', 'happy', 'low', 'irritable', 'anxious', 'tired'])).min(1).max(6),
    symptoms: z.array(z.string().max(40)).max(8).optional(),
  }),
});
