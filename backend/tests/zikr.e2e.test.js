import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { MongoMemoryServer } from "mongodb-memory-server";

const fakeJwt = (payload) => {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" })
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.`;
};

let mongo;

describe("Zikr API", () => {
  beforeAll(async () => {
    process.env.DEV_AUTH_BYPASS = "1";
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { dbName: "ihsan_test" });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase().catch(() => {});
      await mongoose.disconnect().catch(() => {});
    }
    if (mongo) await mongo.stop();
  });

  test("summary requires auth", async () => {
    const res = await request(app).get(`/api/zikr/summary`);
    expect(res.status).toBe(401);
  });

  test("increment updates lifetime totals and creates defaults", async () => {
    const token = fakeJwt({ uid: "u1", email: "u1@test.dev", name: "U1" });

    // Upsert user via verify
    await request(app).post(`/api/auth/verify`).send({ idToken: token });

    // Initial summary
    let sum = await request(app)
      .get(`/api/zikr/summary`)
      .set("Authorization", `Bearer ${token}`);
    expect(sum.status).toBe(200);
    expect(sum.body.totalCount).toBe(0);

    // Increment two types
    await request(app)
      .post(`/api/zikr/increment`)
      .set("Authorization", `Bearer ${token}`)
      .send({ zikrType: "SubhanAllah", amount: 3 });

    await request(app)
      .post(`/api/zikr/increment`)
      .set("Authorization", `Bearer ${token}`)
      .send({ zikrType: "Alhamdulillah", amount: 2 });

    // Check summary
    sum = await request(app)
      .get(`/api/zikr/summary`)
      .set("Authorization", `Bearer ${token}`);
    expect(sum.status).toBe(200);
    expect(sum.body.totalCount).toBe(5);
    const map = Object.fromEntries(
      sum.body.perType.map((t) => [t.zikrType, t.total])
    );
    expect(map["SubhanAllah"]).toBe(3);
    expect(map["Alhamdulillah"]).toBe(2);
  });

  test("batch increment updates multiple types at once", async () => {
    const token = fakeJwt({ uid: "u2", email: "u2@test.dev", name: "U2" });

    await request(app).post(`/api/auth/verify`).send({ idToken: token });

    const res = await request(app)
      .post(`/api/zikr/increment/batch`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        increments: [
          { zikrType: "Allahu Akbar", amount: 10 },
          { zikrType: "La ilaha illallah", amount: 7 },
          { zikrType: "Allahu Akbar", amount: 5 },
        ],
      });
    expect(res.status).toBe(200);

    const sum = await request(app)
      .get(`/api/zikr/summary`)
      .set("Authorization", `Bearer ${token}`);
    expect(sum.status).toBe(200);
    const map = Object.fromEntries(
      sum.body.perType.map((t) => [t.zikrType, t.total])
    );
    expect(map["Allahu Akbar"]).toBe(15);
    expect(map["La ilaha illallah"]).toBe(7);
    expect(sum.body.totalCount).toBe(22);
  });

  test("negative amounts (minus button) decrement DB counts, clamped at 0", async () => {
    const token = fakeJwt({ uid: "u-dec", email: "dec@test.dev", name: "Dec" });
    await request(app).post(`/api/auth/verify`).send({ idToken: token });

    // Count 10, then decrement 3 → 7
    await request(app)
      .post(`/api/zikr/increment/batch`)
      .set("Authorization", `Bearer ${token}`)
      .send({ increments: [{ zikrType: "SubhanAllah", amount: 10 }], timezoneOffset: 360 });
    const dec = await request(app)
      .post(`/api/zikr/increment/batch`)
      .set("Authorization", `Bearer ${token}`)
      .send({ increments: [{ zikrType: "SubhanAllah", amount: -3 }], timezoneOffset: 360 });
    expect(dec.status).toBe(200);

    let sum = await request(app)
      .get(`/api/zikr/summary?timezoneOffset=360`)
      .set("Authorization", `Bearer ${token}`);
    expect(sum.body.totalCount).toBe(7);
    expect(sum.body.today.total).toBe(7);
    expect(sum.body.today.perType["SubhanAllah"]).toBe(7);

    // Over-decrement (-100) clamps the day bucket at 0 and only subtracts
    // what was actually there from the lifetime total
    await request(app)
      .post(`/api/zikr/increment/batch`)
      .set("Authorization", `Bearer ${token}`)
      .send({ increments: [{ zikrType: "SubhanAllah", amount: -100 }], timezoneOffset: 360 });
    sum = await request(app)
      .get(`/api/zikr/summary?timezoneOffset=360`)
      .set("Authorization", `Bearer ${token}`);
    expect(sum.body.today.total).toBe(0);
    expect(sum.body.totalCount).toBe(0);

    // amount 0 is rejected by validation
    const zero = await request(app)
      .post(`/api/zikr/increment/batch`)
      .set("Authorization", `Bearer ${token}`)
      .send({ increments: [{ zikrType: "SubhanAllah", amount: 0 }] });
    expect(zero.status).toBe(400);
  });

  test("types endpoint returns defaults and custom types de-duplicated (case-insensitive)", async () => {
    const token = fakeJwt({ uid: "u3", email: "u3@test.dev", name: "U3" });

    await request(app).post(`/api/auth/verify`).send({ idToken: token });

    // Add custom type
    await request(app)
      .post(`/api/zikr/types`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Morning Zikr" });

    // Duplicate with different case should be ignored
    await request(app)
      .post(`/api/zikr/types`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "morning zikr" });

    const types = await request(app)
      .get(`/api/zikr/types`)
      .set("Authorization", `Bearer ${token}`);
    expect(types.status).toBe(200);
    const names = types.body.types.map((t) => t.name || t);
    expect(names).toContain("Morning Zikr");
    expect(names.filter((n) => n.toLowerCase() === "morning zikr").length).toBe(
      1
    );
  });

describe("Zikr streak (derived)", () => {
  const token = fakeJwt({ uid: "s1", email: "s1@test.dev", name: "S1" });
  const auth = (r) => r.set("Authorization", `Bearer ${token}`);
  const DAY = 24 * 60 * 60 * 1000;

  test("backfilling a missed day reconnects the streak", async () => {
    await request(app).post(`/api/auth/verify`).send({ idToken: token });
    await auth(request(app).post(`/api/analytics/goal`)).send({ dailyTarget: 10 });

    // Meet the goal today only → streak 1
    await auth(request(app).post(`/api/zikr/increment/batch`)).send({
      increments: [{ zikrType: "SubhanAllah", amount: 10 }],
      timezoneOffset: 360,
    });
    let res = await auth(request(app).get(`/api/analytics/streak?timezoneOffset=360`));
    expect(res.body.streak.currentStreak).toBe(1);
    expect(res.body.streak.state).toBe("active");

    // Backfill the day BEFORE yesterday (2 days ago) → gap at yesterday is a
    // single grace day, so the chain connects: streak = 2
    await auth(request(app).post(`/api/zikr/increment/batch`)).send({
      increments: [{ zikrType: "SubhanAllah", amount: 10, ts: Date.now() - 2 * DAY }],
      timezoneOffset: 360,
    });
    res = await auth(request(app).get(`/api/analytics/streak?timezoneOffset=360`));
    expect(res.body.streak.currentStreak).toBe(2);

    // Now backfill yesterday too → no gaps at all: streak = 3
    await auth(request(app).post(`/api/zikr/increment/batch`)).send({
      increments: [{ zikrType: "SubhanAllah", amount: 10, ts: Date.now() - 1 * DAY }],
      timezoneOffset: 360,
    });
    res = await auth(request(app).get(`/api/analytics/streak?timezoneOffset=360`));
    expect(res.body.streak.currentStreak).toBe(3);
  });

  test("ts older than 2 days is rejected", async () => {
    const res = await auth(request(app).post(`/api/zikr/increment/batch`)).send({
      increments: [{ zikrType: "SubhanAllah", amount: 5, ts: Date.now() - 5 * DAY }],
      timezoneOffset: 360,
    });
    expect(res.status).toBe(400);
  });

  test("analytics chart days carry streak statuses", async () => {
    const res = await auth(request(app).get(`/api/analytics?days=7&timezoneOffset=360`));
    expect(res.status).toBe(200);
    const statuses = res.body.chartData.map((d) => d.status);
    expect(statuses.every((s) => ["met", "pending", "grace", "missed"].includes(s))).toBe(true);
    // today is met → last day status 'met'
    expect(statuses[statuses.length - 1]).toBe("met");
  });
});

});
