import Donation, { IDonation } from '../models/Donation.js';
import DonationStats, { IDonationStats, IQuarterlyEntry } from '../models/DonationStats.js';
import { sendMail } from './email.service.js';
import {
  donationReceivedEmail,
  donationVerifiedEmail,
  donationRejectedEmail,
} from './sadaqahEmail.templates.js';

const STATS_ID = 'current';

const httpError = (status: number, message: string): Error & { status: number } => {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
};

/**
 * Atomic upsert — avoids the classic "find, if null then create" race where
 * two concurrent requests both see no doc and both try to insert (the second
 * insert then fails on the _id: 'current' collision). findOneAndUpdate with
 * upsert is a single atomic operation at the Mongo level.
 */
const getOrCreateStats = async () => {
  const stats = await DonationStats.findOneAndUpdate(
    { _id: STATS_ID },
    { $setOnInsert: { _id: STATS_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return stats!;
};

export interface SubmitDonationInput {
  donorName?: string;
  onBehalfOf?: string;
  email: string;
  phone: string;
  paymentMethod: 'bkash' | 'nagad';
  transactionId: string;
  amount: number;
  transactionDate: Date;
  message?: string;
  showNamePublicly?: boolean;
  isAnonymous?: boolean;
}

export const submitDonation = async (
  input: SubmitDonationInput,
  ipAddress: string,
  userId: string | null
): Promise<IDonation> => {
  const isAnonymous = input.isAnonymous ?? false;
  // Anonymous donors are never named, even privately, and a name that isn't
  // stored obviously can't also be shown publicly.
  const donorName = isAnonymous ? null : (input.donorName ?? '').trim();
  const showNamePublicly = isAnonymous ? false : (input.showNamePublicly ?? false);

  const donation = await Donation.create({
    donorName,
    onBehalfOf: input.onBehalfOf?.trim() || null,
    email: input.email.trim(),
    phone: input.phone.trim(),
    paymentMethod: input.paymentMethod,
    transactionId: input.transactionId.trim(),
    amount: input.amount,
    transactionDate: input.transactionDate,
    message: input.message?.trim() || null,
    showNamePublicly,
    isAnonymous,
    userId,
    ipAddress,
  });

  await sendMail({
    to: donation.email,
    ...donationReceivedEmail({
      donorName: donation.donorName,
      amount: donation.amount,
      transactionId: donation.transactionId,
    }),
  });

  return donation;
};

export const getPublicStats = async (): Promise<{
  totalVerifiedAmount: number;
  totalVerifiedCount: number;
  lastUpdated: Date;
  quarterlyBreakdown: IQuarterlyEntry[];
}> => {
  const stats = await getOrCreateStats();
  return {
    totalVerifiedAmount: stats.totalVerifiedAmount,
    totalVerifiedCount: stats.totalVerifiedCount,
    lastUpdated: stats.lastUpdated,
    quarterlyBreakdown: stats.quarterlyBreakdown,
  };
};

/** Bounded — manual verification within 24-48h keeps this queue small in
 *  practice, but a bound protects response size against a pathological backlog. */
export const listPending = async (): Promise<IDonation[]> =>
  Donation.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(200);

export const listAll = async (
  status: 'pending' | 'verified' | 'rejected' | undefined,
  page: number,
  limit: number
): Promise<{ donations: IDonation[]; total: number; page: number; limit: number }> => {
  const filter = status ? { status } : {};
  const [donations, total] = await Promise.all([
    Donation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Donation.countDocuments(filter),
  ]);
  return { donations, total, page, limit };
};

const findPendingOrThrow = async (id: string): Promise<InstanceType<typeof Donation>> => {
  const donation = await Donation.findById(id);
  if (!donation) throw httpError(404, 'Donation not found');
  if (donation.status !== 'pending') {
    throw httpError(409, `Donation is already ${donation.status}`);
  }
  return donation;
};

export const verifyDonation = async (id: string, adminEmail: string): Promise<IDonation> => {
  const donation = await findPendingOrThrow(id);

  donation.status = 'verified';
  donation.verifiedAt = new Date();
  donation.verifiedBy = adminEmail;
  await donation.save();

  await getOrCreateStats();
  await DonationStats.updateOne(
    { _id: STATS_ID },
    {
      $inc: { totalVerifiedAmount: donation.amount, totalVerifiedCount: 1 },
      $set: { lastUpdated: new Date() },
    }
  );

  await sendMail({
    to: donation.email,
    ...donationVerifiedEmail({
      donorName: donation.donorName,
      amount: donation.amount,
      transactionId: donation.transactionId,
    }),
  });

  return donation;
};

export const rejectDonation = async (
  id: string,
  adminEmail: string,
  reason: string
): Promise<IDonation> => {
  const donation = await findPendingOrThrow(id);

  donation.status = 'rejected';
  donation.verifiedAt = new Date();
  donation.verifiedBy = adminEmail;
  donation.rejectionReason = reason;
  await donation.save();

  await sendMail({
    to: donation.email,
    ...donationRejectedEmail({
      donorName: donation.donorName,
      amount: donation.amount,
      transactionId: donation.transactionId,
      reason,
    }),
  });

  return donation;
};

export const upsertQuarterly = async (
  quarter: string,
  patch: { received?: number; spent?: number; notes?: string }
): Promise<IDonationStats> => {
  const stats = await getOrCreateStats();
  const existing = stats.quarterlyBreakdown.find((q) => q.quarter === quarter);
  if (existing) {
    if (patch.received !== undefined) existing.received = patch.received;
    if (patch.spent !== undefined) existing.spent = patch.spent;
    if (patch.notes !== undefined) existing.notes = patch.notes;
  } else {
    stats.quarterlyBreakdown.push({
      quarter,
      received: patch.received ?? 0,
      spent: patch.spent ?? 0,
      notes: patch.notes ?? '',
    });
  }
  await stats.save();
  return stats;
};

export const deleteQuarterly = async (quarter: string): Promise<IDonationStats> => {
  const stats = await getOrCreateStats();
  stats.quarterlyBreakdown = stats.quarterlyBreakdown.filter(
    (q) => q.quarter !== quarter
  ) as typeof stats.quarterlyBreakdown;
  await stats.save();
  return stats;
};
