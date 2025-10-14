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

  test("types endpoint returns defaults and custom types de-duplicated (case-insensitive)", async () => {
    const token = fakeJwt({ uid: "u3", email: "u3@test.dev", name: "U3" });

    await request(app).post(`/api/auth/verify`).send({ idToken: token });

    // Add custom type
    await request(app)
      .post(`/api/zikr/type`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Morning Zikr" });

    // Duplicate with different case should be ignored
    await request(app)
      .post(`/api/zikr/type`)
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
});
