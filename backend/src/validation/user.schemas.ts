import { z } from 'zod';

export const updateUserSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).max(100).optional(),
    photoUrl: z.string().url().optional(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_say']).optional(),
    birthDate: z.string().datetime().optional(),
    occupation: z.string().max(100).optional(),
    bio: z.string().max(250).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
  }),
});
