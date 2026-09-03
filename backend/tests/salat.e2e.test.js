import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

const fakeJwt = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.`;
};

let mongo;

describe('Salat API', () => {
  beforeAll(async () => {
    process.env.DEV_AUTH_BYPASS = '1';
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { dbName: 'ihsan_test_salat' });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase().catch(() => {});
      await mongoose.disconnect().catch(() => {});
    }
    if (mongo) await mongo.stop();
  });

  const token = fakeJwt({ uid: 'sal1', email: 'sal1@test.dev', name: 'Sal1' });
  const auth = (r) => r.set('Authorization', `Bearer ${token}`);
  const today = new Date().toISOString().substring(0, 10);

  test('GET / requires auth', async () => {
    const res = await request(app).get('/api/salat');
    expect(res.status).toBe(401);
  });

  test('GET / returns empty log for today on first call', async () => {
    // Ensure user exists
    await request(app).post('/api/auth/verify').send({ idToken: token });

    const res = await auth(request(app).get(`/api/salat?date=${today}`));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('PATCH /prayer marks a prayer completed and logs debt on miss', async () => {
    const token2 = fakeJwt({ uid: 'sal2', email: 'sal2@test.dev', name: 'Sal2' });
    const auth2 = (r) => r.set('Authorization', `Bearer ${token2}`);

    await request(app).post('/api/auth/verify').send({ idToken: token2 });

    // Complete fajr
    const res = await auth2(
      request(app)
        .patch('/api/salat/prayer')
        .send({ date: today, prayer: 'fajr', status: 'completed' })
    );
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Verify the log has fajr completed
    const log = await auth2(request(app).get(`/api/salat?date=${today}`));
    expect(log.status).toBe(200);
    const prayers = log.body.log?.prayers ?? {};
    expect(prayers.fajr?.status).toBe('completed');
  });

  test('PATCH /prayer increments debt when prayer marked missed', async () => {
    const token3 = fakeJwt({ uid: 'sal3', email: 'sal3@test.dev', name: 'Sal3' });
    const auth3 = (r) => r.set('Authorization', `Bearer ${token3}`);

    await request(app).post('/api/auth/verify').send({ idToken: token3 });

    // Check initial debt (response spreads { owed, totalOwed } at body level)
    const debt0 = await auth3(request(app).get('/api/salat/debt'));
    expect(debt0.status).toBe(200);
    const initialFajrDebt = debt0.body.owed?.fajr ?? 0;

    // Mark fajr missed
    await auth3(
      request(app)
        .patch('/api/salat/prayer')
        .send({ date: today, prayer: 'fajr', status: 'missed' })
    );

    const debt1 = await auth3(request(app).get('/api/salat/debt'));
    expect(debt1.status).toBe(200);
    expect(debt1.body.owed.fajr).toBe(initialFajrDebt + 1);

    // Undo the miss → debt decrements
    await auth3(
      request(app)
        .patch('/api/salat/prayer')
        .send({ date: today, prayer: 'fajr', status: 'completed' })
    );

    const debt2 = await auth3(request(app).get('/api/salat/debt'));
    expect(debt2.status).toBe(200);
    expect(debt2.body.owed.fajr).toBe(initialFajrDebt);
  });

  test('PATCH /nafl stores nafl data', async () => {
    const res = await auth(
      request(app)
        .patch('/api/salat/nafl')
        .send({ date: today, completed: true, types: ['tahajjud', 'duha'], rakat: 4 })
    );
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const log = await auth(request(app).get(`/api/salat?date=${today}`));
    expect(log.body.log?.nafl?.types).toEqual(expect.arrayContaining(['tahajjud', 'duha']));
  });

  test('GET /analytics returns completion stats', async () => {
    const res = await auth(request(app).get('/api/salat/analytics?days=7'));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.completionRate).toBe('number');
    expect(typeof res.body.currentStreak).toBe('number');
  });

  test('GET /debt/history returns weeks array', async () => {
    const res = await auth(request(app).get('/api/salat/debt/history?days=30'));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.weeks)).toBe(true);
  });

  test('PATCH /debt/adjust changes debt by delta', async () => {
    const token4 = fakeJwt({ uid: 'sal4', email: 'sal4@test.dev', name: 'Sal4' });
    const auth4 = (r) => r.set('Authorization', `Bearer ${token4}`);

    await request(app).post('/api/auth/verify').send({ idToken: token4 });

    // Adjust fajr debt by +2 (response spreads owed directly, not nested under debt)
    const adj = await auth4(
      request(app).patch('/api/salat/debt/adjust').send({ prayer: 'fajr', delta: 2, date: today })
    );
    expect(adj.status).toBe(200);
    expect(adj.body.owed.fajr).toBe(2);

    const debt = await auth4(request(app).get('/api/salat/debt'));
    expect(debt.body.owed.fajr).toBe(2);
  });

  test('DELETE /all removes all salat data', async () => {
    const token5 = fakeJwt({ uid: 'sal5', email: 'sal5@test.dev', name: 'Sal5' });
    const auth5 = (r) => r.set('Authorization', `Bearer ${token5}`);

    await request(app).post('/api/auth/verify').send({ idToken: token5 });

    // Log something first
    await auth5(
      request(app)
        .patch('/api/salat/prayer')
        .send({ date: today, prayer: 'dhuhr', status: 'completed' })
    );

    // Delete all
    const del = await auth5(request(app).delete('/api/salat/all'));
    expect(del.status).toBe(200);

    // Log should now be empty
    const after = await auth5(request(app).get(`/api/salat?date=${today}`));
    expect(after.status).toBe(200);
    const prayers = after.body.log?.prayers ?? {};
    expect(prayers.dhuhr?.status ?? 'pending').toBe('pending');
  });

  test('GET /history returns logs for the requested range', async () => {
    const res = await auth(request(app).get('/api/salat/history?days=7'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.logs ?? res.body.calendar)).toBe(true);
  });

  test('GET /journey returns phase list; POST /reset appends a phase with note', async () => {
    const token6 = fakeJwt({ uid: 'sal6', email: 'sal6@test.dev', name: 'Sal6' });
    const auth6 = (r) => r.set('Authorization', `Bearer ${token6}`);

    // Ensure user exists
    await auth6(request(app).post('/api/auth/verify').send({ token: token6 }));

    // Journey with no resets: one phase from account creation
    const j1 = await auth6(request(app).get(`/api/salat/journey?today=${today}`));
    expect(j1.status).toBe(200);
    expect(Array.isArray(j1.body.phases)).toBe(true);
    expect(j1.body.phases.length).toBe(1);
    expect(j1.body.phases[0].to).toBeNull(); // current phase

    // Reset with a note
    const reset = await auth6(
      request(app).post('/api/salat/reset').send({ today, note: 'Fresh start' })
    );
    expect(reset.status).toBe(200);
    expect(reset.body.resetDate).toBe(today);

    // Journey should now have two phases (current + pre-reset)
    const j2 = await auth6(request(app).get(`/api/salat/journey?today=${today}`));
    expect(j2.status).toBe(200);
    // Current phase (newest) is first; pre-reset phase has a resetNote
    expect(j2.body.phases[0].to).toBeNull(); // current
    const closedPhase = j2.body.phases.find((p) => p.to !== null);
    expect(closedPhase?.resetNote).toBe('Fresh start');
  });
});
