import { z } from 'zod';

const categoriesSchema = z
  .object({
    streakAtRisk: z.boolean().optional(),
    adhkarWindows: z.boolean().optional(),
    weeklySummary: z.boolean().optional(),
    // Accepted but never acted on yet — see PushSubscription model doc comment.
    adhan: z.boolean().optional(),
  })
  .optional();

export const subscribeSchema = z.object({
  body: z.object({
    endpoint: z.string().url().max(2048),
    keys: z.object({
      p256dh: z.string().min(1).max(500),
      auth: z.string().min(1).max(500),
    }),
    categories: categoriesSchema,
    // Opportunistically captured, not requested specially for this — see
    // User.timezoneOffset/location doc comments.
    timezoneOffset: z.number().int().min(-720).max(840).optional(),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
  }),
});

export const unsubscribeSchema = z.object({
  body: z.object({
    endpoint: z.string().url().max(2048),
  }),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    categories: z.object({
      streakAtRisk: z.boolean().optional(),
      adhkarWindows: z.boolean().optional(),
      weeklySummary: z.boolean().optional(),
      adhan: z.boolean().optional(),
    }),
  }),
});
