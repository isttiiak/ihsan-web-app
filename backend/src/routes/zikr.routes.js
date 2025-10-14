import { Router } from "express";
import User from "../models/User.js";
import ZikrSession from "../models/ZikrSession.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Save a Zikr session (auth required)
router.post("/session", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { date, zikrType, count } = req.body;
    if (!date || !zikrType || typeof count !== "number")
      return res.status(400).json({ error: "Missing fields" });

    const session = await ZikrSession.create({
      userId,
      date: new Date(date),
      zikrType,
      count,
    });

    res.json({ ok: true, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Get stats (auth required)
// /api/zikr/stats?range=7d|30d|all
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const { range = "7d" } = req.query;
    const userId = req.user.uid;

    const now = new Date();
    let start;
    if (range === "7d")
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (range === "30d")
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const match = { userId };
    if (start) match.date = { $gte: start };

    const pipeline = [
      { $match: match },
      {
        $addFields: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        },
      },
      {
        $group: {
          _id: "$day",
          total: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const perDay = await ZikrSession.aggregate(pipeline);

    const perType = await ZikrSession.aggregate([
      { $match: match },
      { $group: { _id: "$zikrType", total: { $sum: "$count" } } },
      { $sort: { total: -1 } },
    ]);

    const totalCount = perType.reduce((acc, x) => acc + x.total, 0);
    const topZikrTypes = perType
      .slice(0, 3)
      .map((x) => ({ name: x._id, total: x.total }));

    res.json({
      ok: true,
      summary: {
        totalCount,
        dailyStats: perDay.map((d) => ({ date: d._id, total: d.total })),
        perType: perType.map((t) => ({ zikrType: t._id, total: t.total })),
        topZikrTypes,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Get preset & user Zikr types (auth required)
router.get("/types", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await User.findOne({ uid: userId });
    const types = user?.zikrTypes || [];
    res.json({ ok: true, types });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Add a custom Zikr type (auth required)
router.post("/type", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOneAndUpdate(
      { uid: userId },
      { $addToSet: { zikrTypes: { name } } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true, types: user.zikrTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Export all sessions (auth required)
router.get("/sessions", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const sessions = await ZikrSession.find({ userId })
      .sort({ date: -1 })
      .limit(2000);
    res.json({ ok: true, sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
