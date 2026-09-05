import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import ZikrDaily from '../src/models/ZikrDaily.js';
import User from '../src/models/User.js';

// For tests, we'll use DEV_AUTH_BYPASS and a fake JWT with uid/email
const fakeJwt = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.`;
};

let mongo;

describe('User profile API', () => {
  beforeAll(async () => {
    process.env.DEV_AUTH_BYPASS = '1';
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { dbName: 'ihsan_test' });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase().catch(() => {});
      await mongoose.disconnect().catch(() => {});
    }
    if (mongo) await mongo.stop();
  });

  test('GET /api/user/me returns 401 without token', async () => {
    const res = await request(app).get('/api/user/me');
    expect(res.status).toBe(401);
  });

  test('PATCH /api/user/me creates/updates profile fields', async () => {
    const token = fakeJwt({ uid: 'u1', email: 'u1@test.dev' });

    // Upsert via verify (optional, but mirrors real flow)
    const verify = await request(app).post('/api/auth/verify').send({ idToken: token });
    expect(verify.status).toBe(200);

    const patch = await request(app)
      .patch('/api/user/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        displayName: 'Test User',
        photoUrl: 'https://example.com/a.png',
        gender: 'male',
        birthDate: '2000-01-01',
        occupation: 'Engineer',
      });
    expect(patch.status).toBe(200);
    expect(patch.body.user.displayName).toBe('Test User');
    expect(patch.body.user.gender).toBe('male');
    expect(patch.body.user.occupation).toBe('Engineer');

    const get = await request(app).get('/api/user/me').set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body.user.displayName).toBe('Test User');
  });

  test('PATCH /api/user/me rejects invalid gender enum', async () => {
    const token = fakeJwt({ uid: 'u2', email: 'u2@test.dev' });

    await request(app).post('/api/auth/verify').send({ idToken: token });

    const res = await request(app)
      .patch('/api/user/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ gender: 'invalid_value' });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test('v4.9: export → import round-trips every domain (merge, imported wins)', async () => {
    const token = fakeJwt({ uid: 'bkp1', email: 'bkp1@test.dev', name: 'Backup' });
    const auth = (r) => r.set('Authorization', `Bearer ${token}`);
    await request(app).post('/api/auth/verify').send({ idToken: token });

    // Seed data across domains
    await auth(request(app).post('/api/zikr/increment/batch')).send({
      increments: [{ zikrType: 'SubhanAllah', amount: 33 }],
      timezoneOffset: 0,
      today: '2026-07-20',
    });
    await auth(request(app).post('/api/quran/read-ayat')).send({ date: '2026-07-20', count: 5 });
    await auth(request(app).put('/api/fasting/log')).send({
      date: '2026-07-20',
      category: 'voluntary',
      voluntaryKind: 'mon_thu',
      status: 'completed',
    });

    const exp = await auth(request(app).get('/api/user/export'));
    expect(exp.status).toBe(200);
    const backup = exp.body.backup;
    expect(backup.app).toBe('ihsan');
    expect(backup.version).toBe(1);
    expect(backup.zikr.zikrTotals.SubhanAllah).toBe(33);
    expect(backup.quran.logs.length).toBe(1);
    expect(backup.fasting.logs.length).toBe(1);

    // Wipe zikr, then restore from the backup
    await auth(request(app).delete('/api/zikr/all'));
    const imp = await auth(request(app).post('/api/user/import')).send(backup);
    expect(imp.status).toBe(200);
    expect(imp.body.counts.zikrDays).toBe(1);

    const summary = await auth(request(app).get('/api/zikr/summary?timezoneOffset=0'));
    const perType = Object.fromEntries(summary.body.perType.map((p) => [p.zikrType, p.total]));
    expect(perType.SubhanAllah).toBe(33);

    // Garbage files are rejected
    const bad = await auth(request(app).post('/api/user/import')).send({ hello: 'world' });
    expect(bad.status).toBe(400);
  });

  test('DELETE /api/user/me purges Mongo data and succeeds without Firebase Admin configured', async () => {
    // This environment runs with DEV_AUTH_BYPASS and no Firebase service
    // account — deleteAccount() must not try to call admin.auth().deleteUser()
    // here (it would throw "app/no-app" and turn a successful purge into a
    // 500), and must skip that step cleanly instead.
    const token = fakeJwt({ uid: 'del1', email: 'del1@test.dev' });
    const auth = (r) => r.set('Authorization', `Bearer ${token}`);
    await request(app).post('/api/auth/verify').send({ idToken: token });

    await auth(request(app).patch('/api/user/me')).send({ displayName: 'Delete Me' });
    await auth(request(app).post('/api/zikr/increment/batch')).send({
      increments: [{ zikrType: 'SubhanAllah', amount: 10 }],
      timezoneOffset: 0,
      today: '2026-07-20',
    });

    const del = await auth(request(app).delete('/api/user/me'));
    expect(del.status).toBe(200);
    expect(del.body.ok).toBe(true);

    // The Mongo documents are actually gone, not just the API response looking clean.
    expect(await User.findOne({ uid: 'del1' })).toBeNull();
    expect(await ZikrDaily.countDocuments({ userId: 'del1' })).toBe(0);

    // A GET no longer finds a profile either.
    const get = await auth(request(app).get('/api/user/me'));
    expect(get.status).toBe(404);
  });

  test('DELETE /api/user/me rejects a stale auth_time with reauth_required', async () => {
    const staleAuthTime = Math.floor(Date.now() / 1000) - 10 * 60; // 10 minutes ago
    const token = fakeJwt({ uid: 'del2', email: 'del2@test.dev', auth_time: staleAuthTime });
    const auth = (r) => r.set('Authorization', `Bearer ${token}`);
    await request(app).post('/api/auth/verify').send({ idToken: token });

    const res = await auth(request(app).delete('/api/user/me'));
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('reauth_required');

    // Rejected before any purge happened.
    expect(await User.findOne({ uid: 'del2' })).not.toBeNull();
  });

  test('DELETE /api/user/me allows a fresh auth_time', async () => {
    const freshAuthTime = Math.floor(Date.now() / 1000) - 30; // 30 seconds ago
    const token = fakeJwt({ uid: 'del3', email: 'del3@test.dev', auth_time: freshAuthTime });
    const auth = (r) => r.set('Authorization', `Bearer ${token}`);
    await request(app).post('/api/auth/verify').send({ idToken: token });

    const res = await auth(request(app).delete('/api/user/me'));
    expect(res.status).toBe(200);
  });
});
