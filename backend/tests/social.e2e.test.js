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

describe("Social API (share activities)", () => {
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

  const tokenA = fakeJwt({ uid: "amir", email: "amir@test.dev", name: "Amir" });
  const tokenB = fakeJwt({ uid: "bilal", email: "bilal@test.dev", name: "Bilal" });
  const asA = (r) => r.set("Authorization", `Bearer ${tokenA}`);
  const asB = (r) => r.set("Authorization", `Bearer ${tokenB}`);

  let codeA;

  test("summary requires auth", async () => {
    const res = await request(app).get(`/api/social/summary`);
    expect(res.status).toBe(401);
  });

  test("summary creates a profile with an invite code; leaderboard contains me", async () => {
    await request(app).post(`/api/auth/verify`).send({ idToken: tokenA });
    await request(app).post(`/api/auth/verify`).send({ idToken: tokenB });

    const res = await asA(request(app).get(`/api/social/summary?today=2026-07-09&timezoneOffset=360`));
    expect(res.status).toBe(200);
    expect(res.body.inviteCode).toMatch(/^[A-Za-z0-9_-]{6,}$/);
    expect(res.body.leaderboard).toHaveLength(1);
    expect(res.body.leaderboard[0].isMe).toBe(true);
    codeA = res.body.inviteCode;
  });

  test("cannot connect with your own code", async () => {
    const res = await asA(request(app).post(`/api/social/connect`)).send({ code: codeA });
    expect(res.status).toBe(400);
  });

  test("invalid code is rejected politely", async () => {
    const res = await asB(request(app).post(`/api/social/connect`)).send({ code: "nope-nope" });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("friend connects via invite code — mutual, idempotent", async () => {
    const res = await asB(request(app).post(`/api/social/connect`)).send({ code: codeA });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.friendUid).toBe("amir");

    // Idempotent second connect
    const again = await asB(request(app).post(`/api/social/connect`)).send({ code: codeA });
    expect(again.status).toBe(200);
    expect(again.body.message).toMatch(/already/i);

    // Both sides see each other
    const sumA = await asA(request(app).get(`/api/social/summary?today=2026-07-09&timezoneOffset=360`));
    const sumB = await asB(request(app).get(`/api/social/summary?today=2026-07-09&timezoneOffset=360`));
    expect(sumA.body.leaderboard.map((f) => f.uid).sort()).toEqual(["amir", "bilal"]);
    expect(sumB.body.leaderboard.map((f) => f.uid).sort()).toEqual(["amir", "bilal"]);
  });

  test("leaderboard ranks by activity score", async () => {
    // Bilal does zikr (meets default goal 100) → his score should rise above Amir's
    await asB(request(app).post(`/api/zikr/increment/batch`)).send({
      increments: [{ zikrType: "SubhanAllah", amount: 120 }],
      timezoneOffset: 360,
    });
    // Bilal also prays two fard prayers today
    await asB(request(app).patch(`/api/salat/prayer`)).send({
      prayer: "fajr", status: "completed", date: "2026-07-09",
    });
    await asB(request(app).patch(`/api/salat/prayer`)).send({
      prayer: "dhuhr", status: "kaza", date: "2026-07-09",
    });

    const res = await asA(request(app).get(`/api/social/summary?today=2026-07-09&timezoneOffset=360`));
    const [first, second] = res.body.leaderboard;
    expect(first.uid).toBe("bilal");
    expect(first.salatToday).toBe(2);
    expect(first.score).toBeGreaterThan(second.score);
    // Noor components: salat 2*10=20 + zikr streak 1*2=2 + quran 0 + fast 0 → 22
    expect(first.score).toBe(22);
  });

  test("noor endpoint returns today's and all-time Noor", async () => {
    const res = await asB(request(app).get(`/api/social/noor?today=2026-07-09&timezoneOffset=360`));
    expect(res.status).toBe(200);
    // Today matches Bilal's leaderboard score (22)
    expect(res.body.today).toBe(22);
    // All-time: today's history-formula day = salat 20 + zikr goal-met 20 = 40
    expect(res.body.allTime).toBe(40);
  });

  test("friends list returns the connection with a connectedSince date", async () => {
    const res = await asA(request(app).get(`/api/social/friends`));
    expect(res.status).toBe(200);
    expect(res.body.friends).toHaveLength(1);
    expect(res.body.friends[0].uid).toBe("bilal");
    expect(res.body.friends[0].displayName).toBe("Bilal");
    expect(res.body.friends[0].connectedSince).not.toBeNull();
    expect(new Date(res.body.friends[0].connectedSince).getTime()).not.toBeNaN();

    // Symmetric on Bilal's side too
    const resB = await asB(request(app).get(`/api/social/friends`));
    expect(resB.body.friends).toHaveLength(1);
    expect(resB.body.friends[0].uid).toBe("amir");
  });

  test("unfriend removes the connection on both sides", async () => {
    const res = await asA(request(app).delete(`/api/social/friends/bilal`));
    expect(res.status).toBe(200);

    const sumA = await asA(request(app).get(`/api/social/summary?today=2026-07-09&timezoneOffset=360`));
    const sumB = await asB(request(app).get(`/api/social/summary?today=2026-07-09&timezoneOffset=360`));
    expect(sumA.body.leaderboard).toHaveLength(1);
    expect(sumB.body.leaderboard).toHaveLength(1);

    // Friends list is now empty on both sides
    const listA = await asA(request(app).get(`/api/social/friends`));
    const listB = await asB(request(app).get(`/api/social/friends`));
    expect(listA.body.friends).toHaveLength(0);
    expect(listB.body.friends).toHaveLength(0);
  });
});
