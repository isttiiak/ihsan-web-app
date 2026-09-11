import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import Donation from '../src/models/Donation.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

const fakeJwt = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.`;
};

const ADMIN_EMAIL = 'admin@test.dev';
const adminToken = fakeJwt({ uid: 'admin-uid', email: ADMIN_EMAIL });
const nonAdminToken = fakeJwt({ uid: 'regular-uid', email: 'nobody@test.dev' });

let mongo;

const validDonation = (overrides = {}) => ({
  donorName: 'Test Donor',
  email: 'donor@test.dev',
  phone: '01712345678',
  paymentMethod: 'bkash',
  transactionId: `TX${Date.now()}${Math.floor(Math.random() * 1_000_000)}`,
  amount: 500,
  transactionDate: new Date().toISOString().slice(0, 10),
  ...overrides,
});

const submitAndFindPending = async (donation) => {
  await request(app).post('/api/sadaqah/submit').send(donation);
  const pending = await request(app)
    .get('/api/admin/sadaqah/pending')
    .set('Authorization', `Bearer ${adminToken}`);
  return pending.body.donations.find(
    (d) => d.transactionId === donation.transactionId.toUpperCase()
  );
};

describe('Sadaqah admin API', () => {
  beforeAll(async () => {
    process.env.ADMIN_EMAILS = ADMIN_EMAIL;
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'ihsan_test' });
    await Donation.init();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase().catch(() => {});
      await mongoose.disconnect().catch(() => {});
    }
    if (mongo) await mongo.stop();
  });

  test('admin routes require auth', async () => {
    const res = await request(app).get('/api/admin/sadaqah/pending');
    expect(res.status).toBe(401);
  });

  test('admin routes reject a signed-in non-admin', async () => {
    const res = await request(app)
      .get('/api/admin/sadaqah/pending')
      .set('Authorization', `Bearer ${nonAdminToken}`);
    expect(res.status).toBe(403);
  });

  test('verify flow: moves a pending donation to verified and updates public stats', async () => {
    const donation = validDonation();
    const found = await submitAndFindPending(donation);
    expect(found).toBeTruthy();

    const verify = await request(app)
      .patch(`/api/admin/sadaqah/${found._id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(verify.status).toBe(200);
    expect(verify.body.donation.status).toBe('verified');
    expect(verify.body.donation.verifiedBy).toBe(ADMIN_EMAIL);

    const stats = await request(app).get('/api/sadaqah/stats');
    expect(stats.body.totalVerifiedAmount).toBe(donation.amount);
    expect(stats.body.totalVerifiedCount).toBe(1);
  });

  test('verifying an already-actioned donation is rejected', async () => {
    const found = await submitAndFindPending(validDonation());

    const first = await request(app)
      .patch(`/api/admin/sadaqah/${found._id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(first.status).toBe(200);

    const second = await request(app)
      .patch(`/api/admin/sadaqah/${found._id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(second.status).toBe(409);
  });

  test('reject flow: records a reason and does not touch verified stats', async () => {
    const before = await request(app).get('/api/sadaqah/stats');
    const found = await submitAndFindPending(validDonation());

    const reject = await request(app)
      .patch(`/api/admin/sadaqah/${found._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'No matching bKash transaction found for this ID.' });
    expect(reject.status).toBe(200);
    expect(reject.body.donation.status).toBe('rejected');
    expect(reject.body.donation.rejectionReason).toMatch(/no matching/i);

    const after = await request(app).get('/api/sadaqah/stats');
    expect(after.body.totalVerifiedAmount).toBe(before.body.totalVerifiedAmount);
    expect(after.body.totalVerifiedCount).toBe(before.body.totalVerifiedCount);
  });

  test('a rejected transactionId can be legitimately resubmitted', async () => {
    const donation = validDonation();
    const found = await submitAndFindPending(donation);

    await request(app)
      .patch(`/api/admin/sadaqah/${found._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Amount mismatch.' });

    // Same transactionId, corrected amount — should be accepted, not 409,
    // since the partial-unique index only covers pending/verified statuses.
    const resubmit = await request(app)
      .post('/api/sadaqah/submit')
      .send({ ...donation, amount: donation.amount + 50 });
    expect(resubmit.status).toBe(200);
  });

  test('anonymous donation stores no donor name, even in the admin view', async () => {
    const { donorName, ...rest } = validDonation();
    const found = await submitAndFindPending({
      ...rest,
      isAnonymous: true,
      showNamePublicly: true,
    });
    expect(found.donorName).toBeNull();
    expect(found.showNamePublicly).toBe(false);
  });

  test('quarterly breakdown: upsert creates then updates an entry, delete removes it', async () => {
    const upsert1 = await request(app)
      .patch('/api/admin/sadaqah/quarterly/2026-Q3')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ received: 1000, spent: 200, notes: 'Server costs' });
    expect(upsert1.status).toBe(200);
    expect(
      upsert1.body.stats.quarterlyBreakdown.find((q) => q.quarter === '2026-Q3')
    ).toMatchObject({ received: 1000, spent: 200, notes: 'Server costs' });

    const upsert2 = await request(app)
      .patch('/api/admin/sadaqah/quarterly/2026-Q3')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ spent: 350 });
    expect(
      upsert2.body.stats.quarterlyBreakdown.find((q) => q.quarter === '2026-Q3')
    ).toMatchObject({ received: 1000, spent: 350, notes: 'Server costs' });

    const del = await request(app)
      .delete('/api/admin/sadaqah/quarterly/2026-Q3')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
    expect(del.body.stats.quarterlyBreakdown.find((q) => q.quarter === '2026-Q3')).toBeUndefined();
  });

  test('rejects a malformed quarter key', async () => {
    const res = await request(app)
      .patch('/api/admin/sadaqah/quarterly/not-a-quarter')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ received: 100 });
    expect(res.status).toBe(400);
  });
});
