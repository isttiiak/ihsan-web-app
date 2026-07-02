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

describe("Quran API", () => {
  beforeAll(async () => {
    process.env.DEV_AUTH_BYPASS = "1";
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: "ihsan_test" });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase().catch(() => {});
      await mongoose.disconnect().catch(() => {});
    }
    if (mongo) await mongo.stop();
  });

  const token = fakeJwt({ uid: "q1", email: "q1@test.dev", name: "Q1" });
  const auth = (r) => r.set("Authorization", `Bearer ${token}`);

  test("summary requires auth", async () => {
    const res = await request(app).get(`/api/quran/summary`);
    expect(res.status).toBe(401);
  });

  test("reading accumulates within a day and advances the bookmark", async () => {
    let res = await auth(request(app).post(`/api/quran/read`)).send({
      date: "2026-06-30", pages: 2, advancePosition: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.profile.currentPage).toBe(2);

    res = await auth(request(app).post(`/api/quran/read`)).send({
      date: "2026-06-30", pages: 3, advancePosition: true,
    });
    expect(res.body.log.pages).toBe(5);
    expect(res.body.profile.currentPage).toBe(5);
  });

  test("summary computes streak, today's pages, and goal", async () => {
    // Read on 07-01 and 07-02 to form a 3-day streak with 06-30
    await auth(request(app).post(`/api/quran/read`)).send({ date: "2026-07-01", pages: 2, advancePosition: false });
    await auth(request(app).post(`/api/quran/read`)).send({ date: "2026-07-02", pages: 4, advancePosition: false });

    const res = await auth(request(app).get(`/api/quran/summary?today=2026-07-02`));
    expect(res.status).toBe(200);
    expect(res.body.todayPages).toBe(4);
    expect(res.body.goalMet).toBe(true); // default goal is 2
    expect(res.body.streak).toBe(3);
    expect(res.body.stats.allTimePages).toBe(11);
    expect(res.body.pace).toBeGreaterThan(0);
    expect(res.body.estDaysToKhatm).toBeGreaterThan(0);
  });

  test("khatm completes and wraps when the bookmark crosses 604", async () => {
    // Jump the bookmark near the end, then read past it
    await auth(request(app).patch(`/api/quran/profile`)).send({ currentPage: 600 });
    const res = await auth(request(app).post(`/api/quran/read`)).send({
      date: "2026-07-02", pages: 10, advancePosition: true,
    });
    expect(res.body.khatmCompleted).toBe(true);
    expect(res.body.profile.khatmCount).toBe(1);
    expect(res.body.profile.currentPage).toBe(6); // 610 - 604
  });

  test("profile goal updates and is reflected in summary", async () => {
    await auth(request(app).patch(`/api/quran/profile`)).send({ dailyGoalPages: 20 });
    const res = await auth(request(app).get(`/api/quran/summary?today=2026-07-02`));
    expect(res.body.profile.dailyGoalPages).toBe(20);
    expect(res.body.goalMet).toBe(false); // 14 pages today < 20
  });
});
