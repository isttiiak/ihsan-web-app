import { z } from 'zod';

export const linkGoogleSchema = z.object({
  body: z.object({
    googleEmail: z.string().email(),
    googleUid: z.string().min(1),
  }),
});

export const unlinkGoogleSchema = z.object({
  body: z.object({
    providerUid: z.string().min(1),
  }),
});

export const setPrimaryEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

// photoUrl must be either:
//   (a) an https URL (≤ 2 KB) — the normal path after the Firebase Storage migration, or
//   (b) a data URL total length ≤ 2 KB — legacy guard; new uploads go via Firebase Storage
//       so no large data: URLs should ever arrive here again.
const photoUrlSchema = z
  .string()
  .min(1)
  .refine(
    (val) => {
      if (val.startsWith('https://')) return val.length <= 2048;
      // Reject data: URLs larger than 2 KB — photos must be uploaded to Firebase
      // Storage first; only the resulting https URL is sent to PATCH /api/user/me.
      return val.startsWith('data:') && val.length <= 2048;
    },
    { message: 'photoUrl must be an https URL (<2 KB). Upload photos to Firebase Storage first.' }
  );

export const updateUserSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).max(100).optional(),
    photoUrl: photoUrlSchema.optional(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_say']).optional(),
    birthDate: z.string().date().optional(),
    occupation: z.string().max(100).optional(),
    bio: z.string().max(250).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    hijriOffset: z.number().int().min(-1).max(1).optional(),
  }),
});
