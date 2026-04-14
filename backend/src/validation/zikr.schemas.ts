import { z } from 'zod';

export const incrementSchema = z.object({
  body: z.object({
    zikrType: z.string().min(1).max(100),
    amount: z.number().int().positive().default(1),
    ts: z.number().optional(),
    timezoneOffset: z.number().min(-720).max(840).optional(),
  }),
});

export const batchIncrementSchema = z.object({
  body: z.object({
    increments: z
      .array(
        z.object({
          zikrType: z.string().min(1).max(100),
          amount: z.number().int().positive().default(1),
          ts: z.number().optional(),
        })
      )
      .min(1)
      .max(100),
    timezoneOffset: z.number().min(-720).max(840).optional(),
  }),
});

export const addZikrTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim(),
  }),
});
