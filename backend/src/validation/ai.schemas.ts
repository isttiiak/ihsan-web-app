import { z } from 'zod';

export const aiSuggestSchema = z.object({
  body: z.object({
    userSummary: z.string().max(500).optional(),
  }),
});
