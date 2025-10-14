export default {
  testEnvironment: "node",
  transform: {},
  roots: ["<rootDir>/tests"],
  verbose: true,
  // Increase default timeout to accommodate mongodb-memory-server binary download/startup
  testTimeout: 120000,
  // Global setup after env is ready
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
};
