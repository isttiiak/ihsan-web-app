import { z } from 'zod';

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const startCycleSchema = z.object({
  body: z.object({
    date: dateField,
    type: z.enum(['hayd', 'nifas']).default('hayd'),
  }),
});

export const endCycleSchema = z.object({
  body: z.object({
    date: dateField,
  }),
});

export const cycleProfileSchema = z.object({
  body: z.object({
    madhab: z.enum(['hanafi', 'majority']),
  }),
});
