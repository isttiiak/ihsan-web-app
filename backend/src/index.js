import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./config/mongo.js";
import { initFirebaseAdmin } from "./config/firebaseAdmin.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

// Start
(async () => {
  try {
    await connectDB();
    initFirebaseAdmin();
    app.listen(PORT, () =>
      console.log(`API running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
})();
