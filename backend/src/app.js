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

// Normalize CORS origins from env and allow safe Vercel previews
const rawOrigins = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const allowedOrigins = String(rawOrigins)
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);
// Allow Vercel previews for this project, e.g. ihsan-web-app-main-git-...*.vercel.app
const vercelPreviewRegex = /^https?:\/\/ihsan-web-app-main.*\.vercel\.app$/i;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // non-browser or same-origin
      const normalized = origin.replace(/\/$/, "");
      const ok =
        allowedOrigins.includes(normalized) ||
        vercelPreviewRegex.test(normalized);
      return callback(null, ok);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
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
