// Ensure DEV_AUTH_BYPASS for tests and reduce noisy logs
process.env.DEV_AUTH_BYPASS = process.env.DEV_AUTH_BYPASS || "1";

// Use fast MongoDB Memory Server settings to avoid large downloads repeatedly
// Prefer SYSTEM binaries if available to skip download
process.env.MONGOMS_DOWNLOAD_MIRROR =
  process.env.MONGOMS_DOWNLOAD_MIRROR || "https://fastdl.mongodb.org/";
process.env.MONGOMS_USE_SYSTEM_BINARY =
  process.env.MONGOMS_USE_SYSTEM_BINARY || "0";

// Silence Mongoose strictQuery deprecation warnings in tests
try {
  const mongoose = (await import("mongoose")).default;
  mongoose.set("strictQuery", true);
} catch {}

// Extend Jasmine/Jest timeout if Jasmine is present
if (typeof jasmine !== "undefined") {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = Math.max(
    jasmine.DEFAULT_TIMEOUT_INTERVAL || 5000,
    120000
  );
}
