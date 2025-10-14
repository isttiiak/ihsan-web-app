import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/mongo.js";
import { initFirebaseAdmin } from "./config/firebaseAdmin.js";
import authRoutes from "./routes/auth.routes.js";
import zikrRoutes from "./routes/zikr.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Ihsan API is healthy" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/zikr", zikrRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/user", userRoutes);

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
