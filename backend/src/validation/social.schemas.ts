import { z } from 'zod';

export const connectSchema = z.object({
  body: z.object({
    code: z.string().min(4).max(32).regex(/^[A-Za-z0-9_-]+$/),
  }),
});

export const socialSummarySchema = z.object({
  query: z.object({
    today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    timezoneOffset: z.coerce.number().min(-720).max(840).optional(),
  }),
  body: z.object({}).optional(),
});
