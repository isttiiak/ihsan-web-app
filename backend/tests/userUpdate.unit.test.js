import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as userService from '../src/services/user.service.js';
import { updateUserSchema } from '../src/validation/user.schemas.js';
import User from '../src/models/User.js';

// Regression coverage for a real bug: the Settings "Enable Naseeh" toggle set
// PATCH /api/user/me { aiEnabled: v } and always got a 200 back, but the
// field was never in updateUserSchema — Zod silently stripped it before the
// controller/service ever saw it, so the toggle looked "on" forever (its
// local Zustand/localStorage echo never re-synced from the server) while
// every AI feature's server-side gate (ai.service.ts's resolveAiAccess)
// stayed permanently false. Covering both the schema (does the field survive
// validation) and the service (does it actually reach the DB) so a future
// regression on either layer fails a test instead of failing silently.

const UID = 'user-update-test-1';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'ihsan_test_userupdate' });
  await User.create({ uid: UID, email: 'user-update@test.local', aiEnabled: false });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  }
  if (mongo) await mongo.stop();
});

describe('updateUserSchema: aiEnabled survives validation', () => {
  test('a body of only { aiEnabled: true } parses without being stripped', () => {
    const result = updateUserSchema.safeParse({ body: { aiEnabled: true } });
    expect(result.success).toBe(true);
    expect(result.data.body.aiEnabled).toBe(true);
  });
});

describe('userService.updateUser: aiEnabled actually persists', () => {
  test('setting aiEnabled true is written to the user document', async () => {
    const updated = await userService.updateUser(UID, { aiEnabled: true });
    expect(updated.aiEnabled).toBe(true);
    const fromDb = await User.findOne({ uid: UID }).select('aiEnabled');
    expect(fromDb.aiEnabled).toBe(true);
  });

  test('setting aiEnabled false turns it back off', async () => {
    const updated = await userService.updateUser(UID, { aiEnabled: false });
    expect(updated.aiEnabled).toBe(false);
    const fromDb = await User.findOne({ uid: UID }).select('aiEnabled');
    expect(fromDb.aiEnabled).toBe(false);
  });

  test('omitting aiEnabled entirely leaves the existing value untouched', async () => {
    await userService.updateUser(UID, { aiEnabled: true });
    await userService.updateUser(UID, { displayName: 'Someone' });
    const fromDb = await User.findOne({ uid: UID }).select('aiEnabled');
    expect(fromDb.aiEnabled).toBe(true);
  });
});
