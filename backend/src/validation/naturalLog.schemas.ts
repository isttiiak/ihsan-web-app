import { z } from 'zod';

export const naturalLogParseSchema = z.object({
  body: z.object({
    text: z.string().trim().min(1).max(400),
  }),
});

const salatEntrySchema = z.object({
  prayer: z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']),
  status: z.enum(['completed', 'kaza']),
  location: z.enum(['home', 'mosque', 'jamat']).optional(),
});

const zikrEntrySchema = z.object({
  typeName: z.string().trim().min(1).max(60),
  count: z.number().int().min(1).max(100000),
});

export const naturalLogCommitSchema = z.object({
  body: z.object({
    salat: z.array(salatEntrySchema).max(5).default([]),
    zikr: z.array(zikrEntrySchema).max(10).default([]),
    quranAyat: z.number().int().min(1).max(6236).nullable().optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    timezoneOffset: z.coerce.number().int().min(-720).max(840).optional(),
  }),
});
