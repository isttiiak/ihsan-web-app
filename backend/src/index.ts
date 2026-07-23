import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './config/mongo.js';
import { initFirebaseAdmin } from './config/firebaseAdmin.js';
import app from './app.js';

const PORT = process.env.PORT ?? 5000;

(async () => {
  try {
    await initFirebaseAdmin();
    // Listen BEFORE the DB connect: /api/health (no DB) answers immediately,
    // so Render marks the service live seconds earlier on cold starts.
    // Mongoose buffers model queries until the connection is up.
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    await connectDB();
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();
