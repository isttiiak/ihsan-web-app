import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

// For tests, we'll use DEV_AUTH_BYPASS and a fake JWT with uid/email
const fakeJwt = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.`;
};

let mongo;

describe('POST /api/auth/verify', () => {
  beforeAll(async () => {
    process.env.DEV_AUTH_BYPASS = '1';
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { dbName: 'ihsan_test' });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase().catch(() => {});
      await mongoose.disconnect().catch(() => {});
    }
    if (mongo) await mongo.stop();
  });

  test('(a) valid token creates the user and returns it', async () => {
    const token = fakeJwt({
      uid: 'auth-valid-1',
      email: 'valid1@test.dev',
      name: 'Valid User',
    });

    const res = await request(app).post('/api/auth/verify').send({ idToken: token });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user.uid).toBe('auth-valid-1');
    expect(res.body.user.email).toBe('valid1@test.dev');
    expect(res.body.user.displayName).toBe('Valid User');
  });

  test('(a) valid token is also accepted via the Authorization header', async () => {
    const token = fakeJwt({ uid: 'auth-valid-2', email: 'valid2@test.dev' });

    const res = await request(app)
      .post('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user.uid).toBe('auth-valid-2');
  });

  test('(b) missing token is rejected with 400', async () => {
    const res = await request(app).post('/api/auth/verify').send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'idToken required' });
  });

  test('(c) malformed token (not a JWT) is rejected with 401', async () => {
    const res = await request(app).post('/api/auth/verify').send({ idToken: 'not-a-real-jwt' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Invalid token');
  });

  test('(c) malformed token (valid base64url segments, no uid) is rejected with 401', async () => {
    // Three dot-separated segments so it passes the JWT *shape* check, but the
    // payload carries neither `uid` nor `user_id`.
    const token = fakeJwt({ email: 'no-uid@test.dev' });

    const res = await request(app).post('/api/auth/verify').send({ idToken: token });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Invalid token');
  });

  test('(d) an already-registered user is updated, not duplicated', async () => {
    const uid = 'auth-repeat-1';

    const first = await request(app)
      .post('/api/auth/verify')
      .send({
        idToken: fakeJwt({
          uid,
          email: 'first@test.dev',
          name: 'First Name',
          picture: 'https://example.com/first.png',
        }),
      });
    expect(first.status).toBe(200);
    expect(first.body.user.displayName).toBe('First Name');

    // Re-verify with a changed email and a different `name` claim — email is
    // always refreshed from the token, but displayName/photoUrl are only set
    // on first creation (the user may have edited them in their Profile page).
    const second = await request(app)
      .post('/api/auth/verify')
      .send({
        idToken: fakeJwt({
          uid,
          email: 'second@test.dev',
          name: 'Second Name',
          picture: 'https://example.com/second.png',
        }),
      });

    expect(second.status).toBe(200);
    expect(second.body.ok).toBe(true);
    expect(second.body.user.uid).toBe(uid);
    expect(second.body.user.email).toBe('second@test.dev');
    expect(second.body.user.displayName).toBe('First Name');

    const count = await mongoose.connection.collection('users').countDocuments({ uid });
    expect(count).toBe(1);
  });
});
