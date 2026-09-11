import { z } from 'zod';

const nameField = z.string().trim().min(1).max(100);

const emailField = z.string().trim().email().max(200);

// The bKash-linked number the donor sent from — needed for the admin's
// manual reconciliation against their bKash SMS.
const phoneField = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, 'Enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX)');

// bKash/Nagad transaction IDs are alphanumeric; case is normalized at the
// model layer (uppercase), so validation just blocks obviously-malformed input.
const transactionIdField = z
  .string()
  .trim()
  .min(4)
  .max(50)
  .regex(/^[A-Za-z0-9]+$/, 'Transaction ID should only contain letters and numbers');

// Whole taka only — bKash send-money amounts don't carry paisa, mirroring
// the zikr amount field's own int-only precedent.
const amountField = z.number().int().min(10).max(25000);

// Generous but bounded: catches obvious date typos (wrong year) without
// rejecting a donor reporting a transaction from a while back. +1 day of
// slack on the future side absorbs BDT (UTC+6) vs. server-clock skew.
const transactionDateField = z.coerce
  .date()
  .refine(
    (d) =>
      d.getTime() <= Date.now() + 24 * 60 * 60 * 1000 &&
      d.getTime() >= Date.now() - 365 * 24 * 60 * 60 * 1000,
    { message: 'Transaction date must be within the past year and not in the future' }
  );

export const submitDonationSchema = z.object({
  body: z
    .object({
      donorName: nameField.optional(),
      onBehalfOf: z.string().trim().max(100).optional(),
      email: emailField,
      phone: phoneField,
      paymentMethod: z.enum(['bkash', 'nagad']),
      transactionId: transactionIdField,
      amount: amountField,
      transactionDate: transactionDateField,
      message: z.string().trim().max(500).optional(),
      showNamePublicly: z.boolean().optional().default(false),
      isAnonymous: z.boolean().optional().default(false),
    })
    // Donor name is only optional when donating anonymously — this can't be
    // expressed as a plain per-field rule since it depends on isAnonymous.
    .refine((data) => data.isAnonymous || !!data.donorName?.trim(), {
      message: 'Donor name is required unless donating anonymously',
      path: ['donorName'],
    }),
});

export const adminListQuerySchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'verified', 'rejected']).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});

export const rejectDonationSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(1).max(500),
  }),
});

// 'YYYY-Qn' e.g. '2026-Q3' — sortable as a plain string, matches
// DonationStats.quarterlyBreakdown's `quarter` field.
const quarterField = z.string().regex(/^\d{4}-Q[1-4]$/, "Quarter must look like '2026-Q3'");

export const quarterlyUpsertSchema = z.object({
  params: z.object({ quarter: quarterField }),
  body: z.object({
    received: z.number().min(0).optional(),
    spent: z.number().min(0).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

export const quarterlyParamSchema = z.object({
  params: z.object({ quarter: quarterField }),
});
