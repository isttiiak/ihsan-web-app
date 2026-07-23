import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { MongoMemoryServer } from "mongodb-memory-server";

// For tests, we'll use DEV_AUTH_BYPASS and a fake JWT with uid/email
const fakeJwt = (payload) => {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" })
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.`;
};

let mongo;

describe("User profile API", () => {
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

  test("GET /api/user/me returns 401 without token", async () => {
    const res = await request(app).get("/api/user/me");
    expect(res.status).toBe(401);
  });

  test("PATCH /api/user/me creates/updates profile fields", async () => {
    const token = fakeJwt({ uid: "u1", email: "u1@test.dev" });

    // Upsert via verify (optional, but mirrors real flow)
    const verify = await request(app)
      .post("/api/auth/verify")
      .send({ idToken: token });
    expect(verify.status).toBe(200);

    const patch = await request(app)
      .patch("/api/user/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        displayName: "Test User",
        photoUrl: "https://example.com/a.png",
        gender: "male",
        birthDate: "2000-01-01",
        occupation: "Engineer",
      });
    expect(patch.status).toBe(200);
    expect(patch.body.user.displayName).toBe("Test User");
    expect(patch.body.user.gender).toBe("male");
    expect(patch.body.user.occupation).toBe("Engineer");

    const get = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body.user.displayName).toBe("Test User");
  });

  test("PATCH /api/user/me rejects invalid gender enum", async () => {
    const token = fakeJwt({ uid: "u2", email: "u2@test.dev" });

    await request(app).post("/api/auth/verify").send({ idToken: token });

    const res = await request(app)
      .patch("/api/user/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ gender: "invalid_value" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test("v4.9: export → import round-trips every domain (merge, imported wins)", async () => {
    const token = fakeJwt({ uid: "bkp1", email: "bkp1@test.dev", name: "Backup" });
    const auth = (r) => r.set("Authorization", `Bearer ${token}`);
    await request(app).post("/api/auth/verify").send({ idToken: token });

    // Seed data across domains
    await auth(request(app).post("/api/zikr/increment/batch")).send({
      increments: [{ zikrType: "SubhanAllah", amount: 33 }],
      timezoneOffset: 0,
      today: "2026-07-20",
    });
    await auth(request(app).post("/api/quran/read-ayat")).send({ date: "2026-07-20", count: 5 });
    await auth(request(app).put("/api/fasting/log")).send({
      date: "2026-07-20", category: "voluntary", voluntaryKind: "mon_thu", status: "completed",
    });

    const exp = await auth(request(app).get("/api/user/export"));
    expect(exp.status).toBe(200);
    const backup = exp.body.backup;
    expect(backup.app).toBe("ihsan");
    expect(backup.version).toBe(1);
    expect(backup.zikr.zikrTotals.SubhanAllah).toBe(33);
    expect(backup.quran.logs.length).toBe(1);
    expect(backup.fasting.logs.length).toBe(1);

    // Wipe zikr, then restore from the backup
    await auth(request(app).delete("/api/zikr/all"));
    const imp = await auth(request(app).post("/api/user/import")).send(backup);
    expect(imp.status).toBe(200);
    expect(imp.body.counts.zikrDays).toBe(1);

    const summary = await auth(request(app).get("/api/zikr/summary?timezoneOffset=0"));
    const perType = Object.fromEntries(summary.body.perType.map((p) => [p.zikrType, p.total]));
    expect(perType.SubhanAllah).toBe(33);

    // Garbage files are rejected
    const bad = await auth(request(app).post("/api/user/import")).send({ hello: "world" });
    expect(bad.status).toBe(400);
  });
});
