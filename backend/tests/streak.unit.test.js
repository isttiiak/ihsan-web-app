import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getStreakStatus, classifyDays } from '../src/services/streak.service.js';
import ZikrGoal from '../src/models/ZikrGoal.js';
import ZikrDaily from '../src/models/ZikrDaily.js';

// Direct service-level tests for configurable grace days — the HTTP
// increment/batch endpoint caps backfill at "today minus 2 days" (see the
// comment on tsField in zikr.schemas.ts), which makes it impossible to
// exercise a graceDays=2/3 multi-day gap end-to-end through the API. These
// tests seed ZikrDaily/ZikrGoal directly instead, since getStreakStatus and
// classifyDays are pure(ish) functions over that data.

let mongo;

describe('Streak service: configurable grace days', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'ihsan_test_streak' });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase().catch(() => {});
      await mongoose.disconnect().catch(() => {});
    }
    if (mongo) await mongo.stop();
  });

  const seedDay = (userId, date, count) =>
    ZikrDaily.create({
      userId,
      date: new Date(date + 'T00:00:00.000Z'),
      zikrType: 'SubhanAllah',
      count,
    });

  test('graceDays=2 bridges a 2-day gap that graceDays=1 would break', async () => {
    await ZikrGoal.create({ userId: 'grace2', dailyTarget: 10, graceDays: 2 });
    // Today (09-10) and 3 days back (09-07) met; 09-08 and 09-09 are gaps.
    await seedDay('grace2', '2026-09-10', 10);
    await seedDay('grace2', '2026-09-07', 10);

    const status = await getStreakStatus('grace2', 0, '2026-09-10');
    expect(status.currentStreak).toBe(2); // today + 09-07, the 2-day gap is forgiven
    expect(status.state).toBe('active');
  });

  test('graceDays=0 gives zero tolerance — a single missed day stops the chain immediately', async () => {
    await ZikrGoal.create({ userId: 'grace0', dailyTarget: 10, graceDays: 0 });
    await seedDay('grace0', '2026-09-10', 10); // today only, met
    // 09-09 deliberately has no record (a miss)

    const status = await getStreakStatus('grace0', 0, '2026-09-10');
    expect(status.currentStreak).toBe(1); // just today — no forgiveness for yesterday's gap
    expect(status.state).toBe('active');
  });

  test("classifyDays: a 2-day miss run is 'grace' at graceDays=2 but 'missed' at graceDays=1", () => {
    const totals = new Map([
      ['2026-09-06', 10], // met
      // 09-07, 09-08 missing from the map → 0 → not met
      ['2026-09-09', 10], // met, resolves the gap
    ]);
    const keys = ['2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09'];

    const withGrace2 = classifyDays(keys, totals, 10, '2026-09-10', 2);
    expect(withGrace2['2026-09-07']).toBe('grace');
    expect(withGrace2['2026-09-08']).toBe('grace');

    const withGrace1 = classifyDays(keys, totals, 10, '2026-09-10', 1);
    expect(withGrace1['2026-09-07']).toBe('missed');
    expect(withGrace1['2026-09-08']).toBe('missed');
  });

  test("classifyDays: today itself is 'met' when the goal is reached, not 'pending'", () => {
    const totals = new Map([['2026-09-10', 10]]);
    const statuses = classifyDays(['2026-09-10'], totals, 10, '2026-09-10', 1);
    expect(statuses['2026-09-10']).toBe('met');
  });
});
