import { z } from 'zod';

// zikrType is used as a Mongoose Map key and in $inc dot-paths — names
// containing "." would corrupt the update path and "$" is a Mongo operator
// prefix. Block both. (Arabic, spaces, apostrophes etc. are all fine.)
const zikrTypeName = z
  .string()
  .min(1)
  .max(100)
  .refine((s) => !s.includes('.') && !s.startsWith('$'), {
    message: 'Name may not contain "." or start with "$"',
  });

// Bound a single increment so a stray client (or manual API call) can't
// corrupt lifetime stats with a giant number.
const amountField = z.number().int().positive().max(10_000).default(1);

// Timestamps may only backfill within the last 7 days (and 1 day of clock
// skew into the future) — prevents writing counts into arbitrary history.
const tsField = z
  .number()
  .optional()
  .refine(
    (ts) =>
      ts === undefined ||
      (ts > Date.now() - 7 * 24 * 60 * 60 * 1000 && ts < Date.now() + 24 * 60 * 60 * 1000),
    { message: 'ts out of allowed range' }
  );

export const incrementSchema = z.object({
  body: z.object({
    zikrType: zikrTypeName,
    amount: amountField,
    ts: tsField,
    timezoneOffset: z.number().min(-720).max(840).optional(),
  }),
});

export const batchIncrementSchema = z.object({
  body: z.object({
    increments: z
      .array(
        z.object({
          zikrType: zikrTypeName,
          amount: amountField,
          ts: tsField,
        })
      )
      .min(1)
      .max(100),
    timezoneOffset: z.number().min(-720).max(840).optional(),
  }),
});

export const addZikrTypeSchema = z.object({
  body: z.object({
    name: zikrTypeName.transform((s) => s.trim()),
  }),
});
