import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

// GET /api/user/me — return user info from DB
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// PATCH /api/user/me — update profile
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const {
      displayName,
      photoUrl,
      gender,
      birthDate,
      firstName,
      lastName,
      occupation,
    } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      {
        ...(displayName !== undefined ? { displayName } : {}),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(birthDate !== undefined ? { birthDate } : {}),
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        ...(occupation !== undefined ? { occupation } : {}),
      },
      { new: true, runValidators: true }
    );
    res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    return res
      .status(400)
      .json({ ok: false, error: err.message || "Bad Request" });
  }
});

export default router;
