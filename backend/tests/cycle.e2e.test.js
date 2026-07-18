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

const shift = (dayStr, delta) => {
  const d = new Date(dayStr + "T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

describe("Rayhanah Cycle API", () => {
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

  const tokenM = fakeJwt({ uid: "maryam", email: "maryam@test.dev", name: "Maryam" });
  const tokenZ = fakeJwt({ uid: "zaid", email: "zaid@test.dev", name: "Zaid" });
  const asM = (r) => r.set("Authorization", `Bearer ${tokenM}`);
  const asZ = (r) => r.set("Authorization", `Bearer ${tokenZ}`);

  const TZ = 360;
  const TODAY = new Date(Date.now() + TZ * 60 * 1000).toISOString().slice(0, 10);

  test("summary requires auth", async () => {
    const res = await request(app).get(`/api/cycle/summary`);
    expect(res.status).toBe(401);
  });

  test("start → active status with day count; double-start rejected", async () => {
    await request(app).post(`/api/auth/verify`).send({ idToken: tokenM });

    const started = await asM(request(app).post(`/api/cycle/start`)).send({
      date: shift(TODAY, -3),
      type: "hayd",
    });
    expect(started.status).toBe(200);

    const sum = await asM(request(app).get(`/api/cycle/summary?today=${TODAY}`));
    expect(sum.status).toBe(200);
    expect(sum.body.active).not.toBeNull();
    expect(sum.body.active.type).toBe("hayd");
    expect(sum.body.active.dayCount).toBe(4); // day -3 .. today inclusive
    expect(sum.body.active.beyondMax).toBe(false);
    expect(sum.body.madhab).toBe("majority");

    const again = await asM(request(app).post(`/api/cycle/start`)).send({ date: TODAY });
    expect(again.status).toBe(400);
  });

  test("madhab setting changes the hayd maximum", async () => {
    const upd = await asM(request(app).patch(`/api/cycle/profile`)).send({ madhab: "hanafi" });
    expect(upd.status).toBe(200);
    const sum = await asM(request(app).get(`/api/cycle/summary?today=${TODAY}`));
    expect(sum.body.active.maxDays).toBe(10);
  });

  test("excused leaderboard day: Noor substituted, chips masked, no excused flag leaks", async () => {
    // Maryam does zikr (meets the default goal 100, incl. istighfar) while excused
    await asM(request(app).post(`/api/zikr/increment/batch`)).send({
      increments: [
        { zikrType: "SubhanAllah", amount: 80 },
        { zikrType: "Astaghfirullah", amount: 40 },
      ],
      timezoneOffset: TZ,
      today: TODAY,
    });

    const sum = await asM(request(app).get(`/api/social/summary?today=${TODAY}&timezoneOffset=${TZ}`));
    expect(sum.status).toBe(200);
    const me = sum.body.leaderboard.find((f) => f.isMe);

    // Substituted score: zikr goal met 40 + streak 1*2 + quran 0 + salawat 10 = 52
    expect(me.score).toBe(52);
    // Chips are filled from the same real effort — never 0/5-empty, no flag
    expect(me.salatToday).toBeGreaterThan(0);
    expect(me.fastedToday).toBe(true); // zikr goal met
    expect(me).not.toHaveProperty("excused");
    expect(me).not.toHaveProperty("excusedToday");

    // A non-excused user with identical zikr gets the NORMAL formula
    await request(app).post(`/api/auth/verify`).send({ idToken: tokenZ });
    await asZ(request(app).post(`/api/zikr/increment/batch`)).send({
      increments: [
        { zikrType: "SubhanAllah", amount: 80 },
        { zikrType: "Astaghfirullah", amount: 40 },
      ],
      timezoneOffset: TZ,
      today: TODAY,
    });
    const sumZ = await asZ(request(app).get(`/api/social/summary?today=${TODAY}&timezoneOffset=${TZ}`));
    const zaid = sumZ.body.leaderboard.find((f) => f.isMe);
    expect(zaid.score).toBe(2); // streak only — salat/fast/quran all 0
  });

  test("all-time Noor uses the excused formula on cycle days", async () => {
    const noor = await asM(request(app).get(`/api/social/noor?today=${TODAY}&timezoneOffset=${TZ}`));
    expect(noor.status).toBe(200);
    expect(noor.body.today).toBe(52);
    // Historical excused day: zikr 50 + quran 0 + salawat 10 = 60
    expect(noor.body.allTime).toBe(60);
  });

  test("end cycle; ending again rejected; end before start rejected", async () => {
    const bad = await asM(request(app).post(`/api/cycle/end`)).send({ date: shift(TODAY, -10) });
    expect(bad.status).toBe(400);

    const ended = await asM(request(app).post(`/api/cycle/end`)).send({ date: TODAY });
    expect(ended.status).toBe(200);
    expect(ended.body.log.endDate).toBe(TODAY);

    const again = await asM(request(app).post(`/api/cycle/end`)).send({ date: TODAY });
    expect(again.status).toBe(400);

    const sum = await asM(request(app).get(`/api/cycle/summary?today=${shift(TODAY, 1)}`));
    expect(sum.body.active).toBeNull();
    expect(sum.body.logs).toHaveLength(1);
  });

  test("nifas uses the 40-day maximum", async () => {
    const started = await asM(request(app).post(`/api/cycle/start`)).send({
      date: shift(TODAY, 2), // after the ended hayd (no overlap)
      type: "nifas",
    });
    expect(started.status).toBe(200);
    const sum = await asM(request(app).get(`/api/cycle/summary?today=${shift(TODAY, 3)}`));
    expect(sum.body.active.type).toBe("nifas");
    expect(sum.body.active.maxDays).toBe(40);
    await asM(request(app).post(`/api/cycle/end`)).send({ date: shift(TODAY, 4) });
  });

  test("day wellness note upserts and returns in summary", async () => {
    const put = await asM(request(app).put(`/api/cycle/day`)).send({
      date: TODAY,
      flow: "medium",
      symptoms: ["cramps", "fatigue"],
      mood: "tired",
    });
    expect(put.status).toBe(200);
    expect(put.body.day.flow).toBe("medium");

    // Partial update keeps unspecified fields
    await asM(request(app).put(`/api/cycle/day`)).send({ date: TODAY, mood: "calm" });
    const sum = await asM(request(app).get(`/api/cycle/summary?today=${TODAY}`));
    const day = sum.body.days.find((d) => d.date === TODAY);
    expect(day.flow).toBe("medium");
    expect(day.symptoms).toEqual(["cramps", "fatigue"]);
    expect(day.mood).toBe("calm");

    // Invalid symptom rejected
    const bad = await asM(request(app).put(`/api/cycle/day`)).send({ date: TODAY, symptoms: ["hangry"] });
    expect(bad.status).toBe(400);
  });

  test("delete all wipes cycle data", async () => {
    const del = await asM(request(app).delete(`/api/cycle/all`));
    expect(del.status).toBe(200);
    const sum = await asM(request(app).get(`/api/cycle/summary?today=${TODAY}`));
    expect(sum.body.logs).toHaveLength(0);
    expect(sum.body.active).toBeNull();
  });
});
