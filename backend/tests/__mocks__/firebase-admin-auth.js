// Jest mock for firebase-admin/auth — tests use DEV_AUTH_BYPASS=1 so the real
// module is never called. Prevents jose's ESM-only dependency from failing
// Jest's CJS module loader.
export const getAuth = () => ({
  verifyIdToken: async () => {
    throw new Error('Firebase not configured in test');
  },
});
