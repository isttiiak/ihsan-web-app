import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import zikrRoutes from "./routes/zikr.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const isProd = process.env.NODE_ENV === "production";
app.use(morgan(isProd ? "combined" : "dev"));

// Normalize CORS origins from env
const rawOrigins = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const allowedOrigins = String(rawOrigins)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins,
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

export default app;
