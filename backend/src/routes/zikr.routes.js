import { Router } from "express";
import User from "../models/User.js";
import ZikrDaily from "../models/ZikrDaily.js";
import ZikrGoal from "../models/ZikrGoal.js";
import ZikrStreak from "../models/ZikrStreak.js";
import { requireAuth } from "../middleware/auth.js";
import {
  truncateToTimezone,
  getTodayString,
  DEFAULT_TIMEZONE_OFFSET,
} from "../utils/timezone-flexible.js";

const router = Router();

// Legacy UTC function (keeping for backwards compatibility if needed)
function truncateUTC(dateLike) {
  const d = new Date(dateLike);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Helper function to check and update streak
async function checkAndUpdateStreak(
  userId,
  timezoneOffset = DEFAULT_TIMEZONE_OFFSET
) {
  try {
    const today = truncateToTimezone(Date.now(), timezoneOffset); // Use user's timezone

    // Get today's total count
    const todayRecords = await ZikrDaily.find({ userId, date: today });
    const todayTotal = todayRecords.reduce((sum, r) => sum + r.count, 0);

    // Get goal
    let goal = await ZikrGoal.findOne({ userId });
    if (!goal) {
      goal = new ZikrGoal({ userId, dailyTarget: 100 });
      await goal.save();
    }

    const goalMet = todayTotal >= goal.dailyTarget;

    // Get or create streak
    let streak = await ZikrStreak.findOne({ userId });
    if (!streak) {
      streak = new ZikrStreak({ userId });
    }

    const result = streak.updateStreak(today, goalMet);
    await streak.save();

    return { goalMet, streak, todayTotal };
  } catch (err) {
    console.error("Error checking streak:", err);
    return null;
  }
}

// Single increment
router.post("/increment", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { zikrType, amount = 1, ts, timezoneOffset } = req.body;
    if (!zikrType) return res.status(400).json({ error: "zikrType required" });
    if (!Number.isFinite(amount) || amount <= 0)
      return res.status(400).json({ error: "amount must be > 0" });

    const userOffset =
      timezoneOffset !== undefined ? timezoneOffset : DEFAULT_TIMEZONE_OFFSET;
    const date = truncateToTimezone(ts || Date.now(), userOffset); // Use user's timezone

    try {
      await ZikrDaily.updateOne(
        { userId, date, zikrType },
        { $inc: { count: amount } },
        { upsert: true }
      );
    } catch {}

    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (
      !user.zikrTypes.some(
        (t) => t.name.toLowerCase() === zikrType.toLowerCase()
      )
    )
      user.zikrTypes.push({ name: zikrType });
    user.totalCount += amount;
    user.zikrTotals.set(
      zikrType,
      (user.zikrTotals.get(zikrType) || 0) + amount
    );
    await user.save();

    // Check and update streak
    const streakResult = await checkAndUpdateStreak(userId, userOffset);

    return res.json({
      ok: true,
      totalCount: user.totalCount,
      zikrTotals: Object.fromEntries(user.zikrTotals || []),
      streak: streakResult?.streak,
      todayTotal: streakResult?.todayTotal,
      goalMet: streakResult?.goalMet,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Batch increment: [{ zikrType, amount, ts? }, ...]
router.post("/increment/batch", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { increments, timezoneOffset } = req.body;
    if (!Array.isArray(increments) || !increments.length)
      return res.status(400).json({ error: "increments array required" });

    const userOffset =
      timezoneOffset !== undefined ? timezoneOffset : DEFAULT_TIMEZONE_OFFSET;
    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    for (const item of increments) {
      const { zikrType, amount = 1, ts } = item || {};
      if (!zikrType || !Number.isFinite(amount) || amount <= 0) continue;
      const date = truncateToTimezone(ts || Date.now(), userOffset); // Use user's timezone
      try {
        await ZikrDaily.updateOne(
          { userId, date, zikrType },
          { $inc: { count: amount } },
          { upsert: true }
        );
      } catch {}
      if (
        !user.zikrTypes.some(
          (t) => t.name.toLowerCase() === zikrType.toLowerCase()
        )
      )
        user.zikrTypes.push({ name: zikrType });
      user.totalCount += amount;
      user.zikrTotals.set(
        zikrType,
        (user.zikrTotals.get(zikrType) || 0) + amount
      );
    }

    await user.save();
    // Check and update streak
    const streakResult = await checkAndUpdateStreak(userId, userOffset);

    return res.json({
      ok: true,
      totalCount: user.totalCount,
      zikrTotals: Object.fromEntries(user.zikrTotals || []),
      streak: streakResult?.streak,
      todayTotal: streakResult?.todayTotal,
      goalMet: streakResult?.goalMet,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Summary & types
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Handle both Map and plain object formats
    let perType = [];
    if (user.zikrTotals) {
      if (user.zikrTotals instanceof Map) {
        perType = [...user.zikrTotals.entries()].map(([zikrType, total]) => ({
          zikrType,
          total,
        }));
      } else if (typeof user.zikrTotals === "object") {
        // If it's a plain object, convert it
        perType = Object.entries(user.zikrTotals).map(([zikrType, total]) => ({
          zikrType,
          total,
        }));
      }
    }

    res.json({
      ok: true,
      totalCount: user.totalCount || 0,
      perType: perType.sort((a, b) => b.total - a.total),
      types: user.zikrTypes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

router.get("/types", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    res.json({ ok: true, types: user?.zikrTypes || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

router.post("/type", requireAuth, async (req, res) => {
  try {
    let { name } = req.body;
    if (!name) return res.status(400).json({ error: "Missing fields" });
    name = String(name).trim();
    if (!name) return res.status(400).json({ error: "Empty name" });

    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (
      !user.zikrTypes.some((t) => t.name.toLowerCase() === name.toLowerCase())
    ) {
      user.zikrTypes.push({ name });
      await user.save();
    }
    res.json({ ok: true, types: user.zikrTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
