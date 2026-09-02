// Jest mock for firebase-admin/app — tests use DEV_AUTH_BYPASS=1 so the real
// module is never called. Prevents jose's ESM-only dependency from failing
// Jest's CJS module loader.
export const initializeApp = () => ({});
export const cert = (c) => c;
export const getApps = () => [];
