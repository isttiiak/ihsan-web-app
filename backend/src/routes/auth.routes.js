import { Router } from "express";
import {
  verifyFirebaseToken,
  isFirebaseInitialized,
  decodeUnverifiedJwt,
} from "../config/firebaseAdmin.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Verify Firebase ID token and upsert user (used after login or signup)
router.post("/verify", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const tokenFromHeader = header.startsWith("Bearer ")
      ? header.slice(7)
      : null;
    const idToken = req.body?.idToken || tokenFromHeader;
    if (!idToken) return res.status(400).json({ error: "idToken required" });

    let decoded;
    if (isFirebaseInitialized()) {
      decoded = await verifyFirebaseToken(idToken);
    } else if (
      process.env.NODE_ENV !== "production" &&
      process.env.DEV_AUTH_BYPASS === "1"
    ) {
      decoded = decodeUnverifiedJwt(idToken);
      if (!decoded?.uid) throw new Error("Invalid token");
    } else {
      return res.status(500).json({ ok: false, error: "Auth not configured" });
    }

    const { uid, email, name: displayName, picture } = decoded;

    const user = await User.findOneAndUpdate(
      { uid },
      { uid, email, displayName, ...(picture ? { photoUrl: picture } : {}) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true, user });
  } catch (err) {
    const code = err?.code || err?.errorInfo?.code || null;
    const message = err?.message || err?.errorInfo?.message || "Unauthorized";
    if (process.env.NODE_ENV !== "test") {
      console.error("/api/auth/verify error:", code, message);
    }
    res.status(401).json({ ok: false, error: "Invalid token", code, message });
  }
});

// Get current user (auth required)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
