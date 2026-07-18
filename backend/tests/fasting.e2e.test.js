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

describe("Fasting API", () => {
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

  const token = fakeJwt({ uid: "f1", email: "f1@test.dev", name: "F1" });
  const auth = (r) => r.set("Authorization", `Bearer ${token}`);

  test("endpoints require auth", async () => {
    const res = await request(app).get(`/api/fasting/summary`);
    expect(res.status).toBe(401);
  });

  test("upsert + read a voluntary fast log", async () => {
    const put = await auth(request(app).put(`/api/fasting/log`)).send({
      date: "2026-06-29",
      category: "voluntary",
      voluntaryKind: "mon_thu",
      status: "completed",
      hijri: "14 Muḥarram 1448",
    });
    expect(put.status).toBe(200);
    expect(put.body.log.category).toBe("voluntary");

    const get = await auth(request(app).get(`/api/fasting?date=2026-06-29`));
    expect(get.status).toBe(200);
    expect(get.body.log.voluntaryKind).toBe("mon_thu");
    expect(get.body.log.status).toBe("completed");
  });

  test("one fast per day: upsert replaces, not duplicates", async () => {
    await auth(request(app).put(`/api/fasting/log`)).send({
      date: "2026-06-29",
      category: "qada",
      status: "completed",
    });
    const get = await auth(request(app).get(`/api/fasting?date=2026-06-29`));
    expect(get.body.log.category).toBe("qada");
    expect(get.body.log.voluntaryKind).toBeUndefined();
  });

  test("ramadan category logs with a tarawih flag (dedicated tracker)", async () => {
    const res = await auth(request(app).put(`/api/fasting/log`)).send({
      date: "2026-06-30",
      category: "ramadan",
      status: "completed",
      tarawih: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.log.category).toBe("ramadan");
    expect(res.body.log.tarawih).toBe(true);

    // Toggle tarawih off without touching the fast status
    const upd = await auth(request(app).put(`/api/fasting/log`)).send({
      date: "2026-06-30",
      category: "ramadan",
      status: "completed",
      tarawih: false,
    });
    expect(upd.body.log.tarawih).toBe(false);

    // Clean up so later stats tests aren't affected
    await auth(request(app).delete(`/api/fasting/log?date=2026-06-30`));
  });

  test("nadhr requires a valid vow; vow progress is derived in summary", async () => {
    const noVow = await auth(request(app).put(`/api/fasting/log`)).send({
      date: "2026-06-25",
      category: "nadhr",
      vowId: "64b000000000000000000000",
      status: "completed",
    });
    expect(noVow.status).toBe(400);

    const vowRes = await auth(request(app).post(`/api/fasting/vows`)).send({
      title: "3 days for shifa",
      targetDays: 3,
    });
    expect(vowRes.status).toBe(200);
    const vowId = vowRes.body.profile.vows[0]._id;

    const logged = await auth(request(app).put(`/api/fasting/log`)).send({
      date: "2026-06-25",
      category: "nadhr",
      vowId,
      status: "completed",
    });
    expect(logged.status).toBe(200);

    const summary = await auth(
      request(app).get(`/api/fasting/summary?today=2026-06-30`)
    );
    expect(summary.status).toBe(200);
    expect(summary.body.profile.vows[0].completed).toBe(1);
  });

  test("qada progress and kaffarah consecutive run are derived from logs", async () => {
    await auth(request(app).patch(`/api/fasting/profile`)).send({
      qadaOwed: 5,
      kaffarah: { active: true, targetDays: 60 },
    });

    // qada already logged on 2026-06-29 (test above). Add kaffarah chain 26,27,28.
    for (const d of ["2026-06-26", "2026-06-27", "2026-06-28"]) {
      await auth(request(app).put(`/api/fasting/log`)).send({
        date: d,
        category: "kaffarah",
        status: "completed",
      });
    }
    // Wait — 2026-06-28 then 29 is qada, chain ends at 28.
    const summary = await auth(
      request(app).get(`/api/fasting/summary?today=2026-06-29`)
    );
    expect(summary.body.qadaCompleted).toBe(1);
    expect(summary.body.profile.qadaOwed).toBe(5);
    expect(summary.body.kaffarah.completed).toBe(3);
    // last kaffarah = 06-28, today = 06-29 → not stale, run = 3
    expect(summary.body.kaffarah.runStale).toBe(false);
    expect(summary.body.kaffarah.currentRun).toBe(3);

    // With today far in the future the chain is stale → run resets to 0
    const stale = await auth(
      request(app).get(`/api/fasting/summary?today=2026-07-15`)
    );
    expect(stale.body.kaffarah.runStale).toBe(true);
    expect(stale.body.kaffarah.currentRun).toBe(0);
  });

  test("clear log deletes the day's row", async () => {
    const del = await auth(
      request(app).delete(`/api/fasting/log?date=2026-06-25`)
    );
    expect(del.status).toBe(200);
    expect(del.body.deleted).toBe(true);

    const get = await auth(request(app).get(`/api/fasting?date=2026-06-25`));
    expect(get.body.log).toBeNull();
  });
});
