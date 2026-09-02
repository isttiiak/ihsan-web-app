export default {
  testEnvironment: 'node',
  // Tests are plain ESM .js files but import TypeScript sources with .js
  // specifiers (NodeNext style). Map the .js suffix back to the extensionless
  // path so jest resolves the .ts file, and compile it with ts-jest in ESM mode.
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // firebase-admin v14 pulls in jose (ESM-only) which Jest's CJS loader can't
    // require(). Tests use DEV_AUTH_BYPASS=1 so the real SDK is never called —
    // redirect sub-package imports to lightweight stubs.
    '^firebase-admin/app$': '<rootDir>/tests/__mocks__/firebase-admin-app.js',
    '^firebase-admin/auth$': '<rootDir>/tests/__mocks__/firebase-admin-auth.js',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  roots: ['<rootDir>/tests'],
  verbose: true,
  // Increase default timeout to accommodate mongodb-memory-server binary download/startup
  testTimeout: 120000,
  // Global setup after env is ready
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
};
