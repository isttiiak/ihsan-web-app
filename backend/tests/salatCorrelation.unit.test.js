import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import SalatLog from '../src/models/SalatLog.js';
import { getIshaFajrCorrelation } from '../src/services/salat.service.js';

// Isha-time vs next-day-Fajr correlation is derived entirely from data the
// app already collects (prayedAt timestamps) — no new "log your bedtime"
// feature needed. These tests write SalatLog documents directly (mirrors
// streak.unit.test.js's pattern) since the public API always stamps
// prayedAt with the server's current time, with no way to backdate it.

const UID = 'correlation-1';
const TZ_OFFSET = 360; // UTC+6

function utcIshaAt(dateStr, localHour, localMinute = 0) {
  // local = UTC + offset  =>  UTC = local - offset
  const totalLocalMinutes = localHour * 60 + localMinute;
  const totalUtcMinutes = totalLocalMinutes - TZ_OFFSET;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) + totalUtcMinutes * 60_000);
}

let mongo;

describe('Salat: Isha-time vs next-day Fajr correlation', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'ihsan_test_correlation' });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase().catch(() => {});
      await mongoose.disconnect().catch(() => {});
    }
    if (mongo) await mongo.stop();
  });

  test('not enough data yet: available is false', async () => {
    const result = await getIshaFajrCorrelation(UID, TZ_OFFSET, '2026-02-15');
    expect(result.available).toBe(false);
  });

  test('computes distinct on-time rates for early vs late Isha, once enough days exist', async () => {
    const earlyPairs = [
      ['2026-01-01', '2026-01-02', 'completed'],
      ['2026-01-03', '2026-01-04', 'completed'],
      ['2026-01-05', '2026-01-06', 'completed'],
      ['2026-01-07', '2026-01-08', 'completed'],
      ['2026-01-09', '2026-01-10', 'completed'],
      ['2026-01-11', '2026-01-12', 'missed'],
    ];
    const latePairs = [
      ['2026-01-13', '2026-01-14', 'missed'],
      ['2026-01-15', '2026-01-16', 'missed'],
      ['2026-01-17', '2026-01-18', 'missed'],
      ['2026-01-19', '2026-01-20', 'missed'],
      ['2026-01-21', '2026-01-22', 'completed'],
      ['2026-01-23', '2026-01-24', 'completed'],
    ];

    for (const [ishaDate, fajrDate, fajrStatus] of earlyPairs) {
      await SalatLog.create({
        userId: UID,
        date: ishaDate,
        prayers: { isha: { status: 'completed', prayedAt: utcIshaAt(ishaDate, 21, 0) } },
      });
      await SalatLog.create({
        userId: UID,
        date: fajrDate,
        prayers: { fajr: { status: fajrStatus } },
      });
    }
    for (const [ishaDate, fajrDate, fajrStatus] of latePairs) {
      await SalatLog.create({
        userId: UID,
        date: ishaDate,
        prayers: { isha: { status: 'completed', prayedAt: utcIshaAt(ishaDate, 23, 30) } },
      });
      await SalatLog.create({
        userId: UID,
        date: fajrDate,
        prayers: { fajr: { status: fajrStatus } },
      });
    }

    const result = await getIshaFajrCorrelation(UID, TZ_OFFSET, '2026-02-15');
    expect(result.available).toBe(true);
    expect(result.earlySampleSize).toBe(6);
    expect(result.lateSampleSize).toBe(6);
    expect(result.earlyIshaFajrRate).toBe(83); // 5/6
    expect(result.lateIshaFajrRate).toBe(33); // 2/6
  });
});
