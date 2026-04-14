import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  query: z.object({
    days: z.coerce.number().int().min(1).max(365).default(7),
    timezoneOffset: z.coerce.number().min(-720).max(840).optional(),
  }),
});

export const setGoalSchema = z.object({
  body: z.object({
    dailyTarget: z.number().int().min(1).max(100000),
  }),
});
