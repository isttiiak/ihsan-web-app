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
});
