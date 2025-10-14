import {
  verifyFirebaseToken,
  isFirebaseInitialized,
  decodeUnverifiedJwt,
} from "../config/firebaseAdmin.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing Bearer token" });

    if (isFirebaseInitialized()) {
      const decoded = await verifyFirebaseToken(token);
      req.user = decoded;
      return next();
    }

    // Dev bypass: only in non-production environments
    const isProd = process.env.NODE_ENV === "production";
    if (!isProd && process.env.DEV_AUTH_BYPASS === "1") {
      const payload = decodeUnverifiedJwt(token);
      if (!payload?.uid)
        return res.status(401).json({ error: "Invalid token" });
      req.user = payload;
      return next();
    }

    return res.status(500).json({ error: "Auth not configured" });
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
