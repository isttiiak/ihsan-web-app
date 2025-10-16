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

// Get or create goal
router.get("/goal", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    let goal = await ZikrGoal.findOne({ userId });

    if (!goal) {
      goal = new ZikrGoal({ userId, dailyTarget: 100 });
      await goal.save();
    }

    res.json({ ok: true, goal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Set/update goal
router.post("/goal", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { dailyTarget } = req.body;

    if (!dailyTarget || dailyTarget < 1) {
      return res.status(400).json({ error: "dailyTarget must be at least 1" });
    }

    let goal = await ZikrGoal.findOne({ userId });
    if (!goal) {
      goal = new ZikrGoal({ userId, dailyTarget });
    } else {
      goal.dailyTarget = dailyTarget;
      goal.isActive = true;
    }

    await goal.save();
    res.json({ ok: true, goal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Get streak info
router.get("/streak", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    let streak = await ZikrStreak.findOne({ userId });

    if (!streak) {
      streak = new ZikrStreak({ userId });
      await streak.save();
    }

    res.json({ ok: true, streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Pause streak
router.post("/streak/pause", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    let streak = await ZikrStreak.findOne({ userId });

    if (!streak) {
      streak = new ZikrStreak({ userId });
    }

    const result = streak.pause();
    if (result.ok) {
      await streak.save();
    }

    res.json({ ok: result.ok, message: result.message, streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Resume streak
router.post("/streak/resume", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    let streak = await ZikrStreak.findOne({ userId });

    if (!streak) {
      return res.status(404).json({ error: "Streak not found" });
    }

    const result = streak.resume();
    if (result.ok) {
      await streak.save();
    }

    res.json({ ok: result.ok, message: result.message, streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Check and update streak based on today's progress
router.post("/streak/check", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const today = truncateUTC(Date.now());

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

    res.json({
      ok: true,
      todayTotal,
      goalMet,
      streak,
      message: result.message,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Get analytics data for charts (last N days)
router.get("/analytics", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { days = 7, timezoneOffset } = req.query; // Default 7 days

    const userOffset =
      timezoneOffset !== undefined
        ? parseInt(timezoneOffset)
        : DEFAULT_TIMEZONE_OFFSET;
    const today = truncateToTimezone(Date.now(), userOffset); // Use user's timezone
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - parseInt(days) + 1);

    // Get daily records
    const records = await ZikrDaily.find({
      userId,
      date: { $gte: startDate, $lte: today },
    }).sort({ date: 1 });

    // Group by date
    const dailyTotals = {};
    const dailyBreakdown = {};

    records.forEach((r) => {
      const dateStr = r.date.toISOString().split("T")[0];
      if (!dailyTotals[dateStr]) {
        dailyTotals[dateStr] = 0;
        dailyBreakdown[dateStr] = {};
      }
      dailyTotals[dateStr] += r.count;
      dailyBreakdown[dateStr][r.zikrType] =
        (dailyBreakdown[dateStr][r.zikrType] || 0) + r.count;
    });

    // Fill in missing dates with 0
    const chartData = [];
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      chartData.push({
        date: dateStr,
        total: dailyTotals[dateStr] || 0,
        breakdown: dailyBreakdown[dateStr] || {},
      });
    }

    // Calculate stats
    const totals = chartData.map((d) => d.total);
    const maxDay = chartData.reduce(
      (max, d) => (d.total > max.total ? d : max),
      chartData[0] || { date: null, total: 0 }
    );
    const average =
      totals.length > 0
        ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
        : 0;

    // Get goal and streak
    const goal = await ZikrGoal.findOne({ userId });
    const streak = await ZikrStreak.findOne({ userId });

    // Get today's total and breakdown
    const todayRecords = await ZikrDaily.find({ userId, date: today });
    const todayTotal = todayRecords.reduce((sum, r) => sum + r.count, 0);
    const todayPerType = todayRecords.map((r) => ({
      zikrType: r.zikrType,
      total: r.count,
    }));

    // Get user summary for all-time stats
    const user = await User.findOne({ uid: userId });

    // Get per-type breakdown for all time
    let perType = [];
    if (user && user.zikrTotals) {
      if (user.zikrTotals instanceof Map) {
        perType = [...user.zikrTotals.entries()].map(([zikrType, total]) => ({
          zikrType,
          total,
        }));
      } else if (typeof user.zikrTotals === "object") {
        perType = Object.entries(user.zikrTotals).map(([zikrType, total]) => ({
          zikrType,
          total,
        }));
      }
    }

    // Find all-time best day (max daily total across all history)
    const allDailyRecords = await ZikrDaily.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$date",
          total: { $sum: "$count" },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ]);

    const bestDay =
      allDailyRecords.length > 0
        ? {
            date: allDailyRecords[0]._id,
            count: allDailyRecords[0].total,
          }
        : { date: null, count: 0 };

    res.json({
      ok: true,
      period: {
        days: parseInt(days),
        startDate: startDate.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
      },
      chartData,
      stats: {
        average,
        maxDay: maxDay.date,
        maxCount: maxDay.total,
        total: totals.reduce((a, b) => a + b, 0),
      },
      today: {
        total: todayTotal,
        goalMet: goal ? todayTotal >= goal.dailyTarget : false,
        perType: todayPerType.sort((a, b) => b.total - a.total),
      },
      goal: goal || { dailyTarget: 100, isActive: true },
      streak: streak || { currentStreak: 0, longestStreak: 0 },
      allTime: {
        totalCount: user?.totalCount || 0,
        bestDay: bestDay,
      },
      perType: perType.sort((a, b) => b.total - a.total),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Get comparison data (this period vs last period)
router.get("/analytics/compare", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { days = 7 } = req.query;

    const today = truncateDhakaDate(Date.now()); // Use Dhaka timezone
    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - parseInt(days) + 1);

    const lastPeriodEnd = new Date(periodStart);
    lastPeriodEnd.setDate(lastPeriodEnd.getDate() - 1);
    const lastPeriodStart = new Date(lastPeriodEnd);
    lastPeriodStart.setDate(lastPeriodStart.getDate() - parseInt(days) + 1);

    // Current period
    const currentRecords = await ZikrDaily.find({
      userId,
      date: { $gte: periodStart, $lte: today },
    });
    const currentTotal = currentRecords.reduce((sum, r) => sum + r.count, 0);

    // Last period
    const lastRecords = await ZikrDaily.find({
      userId,
      date: { $gte: lastPeriodStart, $lte: lastPeriodEnd },
    });
    const lastTotal = lastRecords.reduce((sum, r) => sum + r.count, 0);

    const difference = currentTotal - lastTotal;
    const percentChange =
      lastTotal > 0 ? ((difference / lastTotal) * 100).toFixed(1) : 0;

    res.json({
      ok: true,
      current: {
        total: currentTotal,
        period: `${periodStart.toISOString().split("T")[0]} to ${
          today.toISOString().split("T")[0]
        }`,
      },
      last: {
        total: lastTotal,
        period: `${lastPeriodStart.toISOString().split("T")[0]} to ${
          lastPeriodEnd.toISOString().split("T")[0]
        }`,
      },
      comparison: {
        difference,
        percentChange: parseFloat(percentChange),
        trend: difference > 0 ? "up" : difference < 0 ? "down" : "stable",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
