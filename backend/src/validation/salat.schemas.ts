import { z } from 'zod';

export const updatePrayerSchema = z.object({
  body: z.object({
    prayer: z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']),
    status: z.enum(['prayed', 'mosque', 'kaza', 'missed', 'pending']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export const getSalatLogSchema = z.object({
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  body: z.object({}).optional(),
});

export const salatHistorySchema = z.object({
  query: z.object({
    days: z.coerce.number().int().positive().max(90).default(30),
  }),
  body: z.object({}).optional(),
});
