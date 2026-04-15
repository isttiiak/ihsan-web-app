import { z } from 'zod';

export const updatePrayerSchema = z.object({
  body: z.object({
    prayer: z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']),
    status: z.enum(['completed', 'kaza', 'missed', 'pending']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    location: z.enum(['home', 'mosque', 'jamat']).optional(),
    tasbeeh: z.boolean().optional(),
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
    days: z.coerce.number().int().positive().max(365).default(30),
  }),
  body: z.object({}).optional(),
});
