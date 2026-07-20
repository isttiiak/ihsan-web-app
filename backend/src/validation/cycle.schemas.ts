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

export const pastCycleSchema = z.object({
  body: z.object({
    startDate: dateField,
    endDate: dateField,
    type: z.enum(['hayd', 'nifas']).default('hayd'),
    today: dateField,
  }),
});

export const cycleDaySchema = z.object({
  body: z.object({
    date: dateField,
    flow: z.enum(['light', 'medium', 'heavy']).nullable().optional(),
    symptoms: z
      .array(z.enum(['cramps', 'headache', 'fatigue', 'nausea', 'backache', 'bloating', 'tenderness', 'insomnia']))
      .max(8)
      .optional(),
    moods: z
      .array(z.enum(['calm', 'happy', 'low', 'irritable', 'anxious', 'tired']))
      .max(6)
      .optional(),
  }),
});
