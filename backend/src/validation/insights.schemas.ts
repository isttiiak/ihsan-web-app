import { z } from 'zod';

export const worshipCorrelationSchema = z.object({
  query: z.object({
    days: z.coerce.number().int().min(7).max(365).default(30),
    today: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    timezoneOffset: z.coerce.number().min(-720).max(840).optional(),
  }),
});
