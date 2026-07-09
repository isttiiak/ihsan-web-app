import SocialProfile, { generateInviteCode, ISocialProfile, MAX_FRIENDS } from '../models/SocialProfile.js';
import User from '../models/User.js';
import SalatLog, { PRAYER_IDS } from '../models/SalatLog.js';
import FastingLog from '../models/FastingLog.js';
import QuranLog from '../models/QuranLog.js';
import QuranProfile from '../models/QuranProfile.js';
import ZikrGoal from '../models/ZikrGoal.js';
import ZikrDaily from '../models/ZikrDaily.js';
import { getStreakStatus } from './streak.service.js';
import { DEFAULT_TIMEZONE_OFFSET } from '../utils/timezone-flexible.js';

function todayDateString(): string {
  return new Date().toISOString().substring(0, 10);
}

function shiftDateStr(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().substring(0, 10);
}

export async function getOrCreateProfile(userId: string): Promise<ISocialProfile> {
  const existing = await SocialProfile.findOne({ userId });
  if (existing) return existing;
  // Retry a few times on the (astronomically unlikely) code collision
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await SocialProfile.create({ userId, inviteCode: generateInviteCode() });
    } catch (err) {
      const isDup = (err as { code?: number })?.code === 11000;
      if (!isDup) throw err;
      // userId collision (concurrent create) → return the winner
      const winner = await SocialProfile.findOne({ userId });
      if (winner) return winner;
    }
  }
  throw new Error('Could not create social profile');
}

export interface ConnectResult {
  ok: boolean;
  message: string;
  friendUid?: string;
  friendName?: string;
}

export async function connectByCode(userId: string, code: string): Promise<ConnectResult> {
  const owner = await SocialProfile.findOne({ inviteCode: code });
  if (!owner) return { ok: false, message: 'This invite link is not valid.' };
  if (owner.userId === userId) return { ok: false, message: 'That is your own invite link — share it with a friend!' };

  const mine = await getOrCreateProfile(userId);
  const alreadyFriends = mine.friends.includes(owner.userId);
  if (!alreadyFriends) {
    if (mine.friends.length >= MAX_FRIENDS || owner.friends.length >= MAX_FRIENDS) {
      return { ok: false, message: 'Friend limit reached.' };
    }
    // Mutual connection, atomic on each side
    await Promise.all([
      SocialProfile.updateOne({ userId }, { $addToSet: { friends: owner.userId } }),
      SocialProfile.updateOne({ userId: owner.userId }, { $addToSet: { friends: userId } }),
    ]);
  }

  const friendUser = await User.findOne({ uid: owner.userId }).select('displayName');
  return {
    ok: true,
    message: alreadyFriends ? 'You are already connected!' : 'Connected!',
    friendUid: owner.userId,
    friendName: friendUser?.displayName ?? 'your friend',
  };
}

export async function unfriend(userId: string, friendUid: string): Promise<{ ok: boolean }> {
  await Promise.all([
    SocialProfile.updateOne({ userId }, { $pull: { friends: friendUid } }),
    SocialProfile.updateOne({ userId: friendUid }, { $pull: { friends: userId } }),
  ]);
  return { ok: true };
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface FriendStats {
  uid: string;
  displayName: string;
  /** Only http(s) URLs — base64 data-URL photos are skipped to keep the payload small */
  photoUrl?: string;
  isMe: boolean;
  salatToday: number;      // 0..5 fard prayers completed/kaza today
  zikrStreak: number;
  zikrState: string;       // active | grace | none | paused
  zikrToday: number;
  zikrGoal: number;
  zikrGoalMet: boolean;
  fastsThisMonth: number;
  /** Fasting today (completed, or intended while the day is in progress) */
  fastedToday: boolean;
  quranStreak: number;
  quranPagesToday: number;
  quranGoal: number;
  score: number;           // Noor, 0..100
}

/**
 * Daily Noor (max 100) — deliberately transparent (Istiak's spec, 2026-07-09):
 *   up to 50  — today's fard prayers (10 each)
 *   up to 20  — zikr STREAK (2 per day, capped at 10 days)
 *   up to 20  — today's Quran reading vs the user's daily goal (full 20 when met)
 *   +10       — fasting today (completed, or intended while the day runs)
 * Resets naturally every day (it is computed from "today"); All-time Noor
 * accumulates day scores and never resets.
 */
function computeScore(s: Omit<FriendStats, 'score' | 'uid' | 'displayName' | 'photoUrl' | 'isMe'>): number {
  const salatPts = Math.min(5, s.salatToday) * 10;
  const zikrStreakPts = Math.min(10, s.zikrStreak) * 2;
  const quranPts = Math.round(Math.min(1, s.quranGoal > 0 ? s.quranPagesToday / s.quranGoal : 0) * 20);
  const fastPts = s.fastedToday ? 10 : 0;
  return salatPts + zikrStreakPts + quranPts + fastPts;
}

async function statsForUser(
  uid: string,
  viewerUid: string,
  today: string,
  timezoneOffset: number
): Promise<FriendStats> {
  const monthStart = today.substring(0, 8) + '01';
  const quranSince = shiftDateStr(today, -30);

  const [user, zikr, salatLog, fastsThisMonth, todayFastLog, quranLogs, quranProfile] = await Promise.all([
    User.findOne({ uid }).select('displayName photoUrl'),
    getStreakStatus(uid, timezoneOffset),
    SalatLog.findOne({ userId: uid, date: today }),
    FastingLog.countDocuments({ userId: uid, status: 'completed', date: { $gte: monthStart, $lte: today } }),
    FastingLog.findOne({ userId: uid, date: today }).select('status'),
    QuranLog.find({ userId: uid, date: { $gte: quranSince, $lte: today } }).select('date pages'),
    QuranProfile.findOne({ userId: uid }).select('dailyGoalPages'),
  ]);

  let salatToday = 0;
  if (salatLog) {
    for (const pid of PRAYER_IDS) {
      const s = salatLog.prayers[pid]?.status;
      if (s === 'completed' || s === 'kaza') salatToday++;
    }
  }

  const quranByDate = new Map(quranLogs.map((l) => [l.date, l.pages]));
  const quranPagesToday = quranByDate.get(today) ?? 0;
  let quranStreak = 0;
  let cursor = quranPagesToday > 0 ? today : shiftDateStr(today, -1);
  while ((quranByDate.get(cursor) ?? 0) > 0 && quranStreak < 30) {
    quranStreak++;
    cursor = shiftDateStr(cursor, -1);
  }

  const base = {
    isMe: uid === viewerUid,
    salatToday,
    zikrStreak: zikr.currentStreak,
    zikrState: zikr.state,
    zikrToday: zikr.todayTotal,
    zikrGoal: zikr.dailyTarget,
    zikrGoalMet: zikr.goalMet,
    fastsThisMonth,
    fastedToday: todayFastLog?.status === 'completed' || todayFastLog?.status === 'intended',
    quranStreak,
    quranPagesToday,
    quranGoal: quranProfile?.dailyGoalPages ?? 2,
  };

  const photo = user?.photoUrl;
  return {
    uid,
    displayName: user?.displayName || 'Ihsan user',
    ...(photo && /^https?:\/\//.test(photo) ? { photoUrl: photo } : {}),
    ...base,
    score: computeScore(base),
  };
}

export interface SocialSummary {
  inviteCode: string;
  leaderboard: FriendStats[]; // me + friends, ranked by score desc
}

export async function getSummary(
  userId: string,
  today?: string,
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET
): Promise<SocialSummary> {
  const end = today ?? todayDateString();
  const profile = await getOrCreateProfile(userId);

  // Everyone is judged on the VIEWER's calendar date — a consistent basis for
  // one ranked list (documented in CLAUDE.md).
  const uids = [userId, ...profile.friends.slice(0, MAX_FRIENDS)];
  const stats = await Promise.all(uids.map((uid) => statsForUser(uid, userId, end, timezoneOffset)));

  stats.sort((a, b) =>
    b.score - a.score
    || b.zikrStreak - a.zikrStreak
    || a.displayName.localeCompare(b.displayName)
  );

  return { inviteCode: profile.inviteCode, leaderboard: stats };
}

// ─── Noor (navbar capsules) ───────────────────────────────────────────────────

export interface NoorResult {
  today: number;
  allTime: number;
}

/**
 * Today's Noor = the live leaderboard score.
 * All-time Noor = the daily formula applied to every recorded day of the last
 * 365 days and summed — it only ever grows. (A streak is a live property, so
 * the historical zikr component uses that day's goal progress instead;
 * current goals are applied to history — good enough for a motivation number.)
 */
export async function getNoor(
  userId: string,
  today?: string,
  timezoneOffset: number = DEFAULT_TIMEZONE_OFFSET
): Promise<NoorResult> {
  const end = today ?? todayDateString();
  const since = shiftDateStr(end, -364);

  const [me, salatLogs, zikrRows, quranLogs, fastLogs, zikrGoalDoc, quranProfile] = await Promise.all([
    statsForUser(userId, userId, end, timezoneOffset),
    SalatLog.find({ userId, date: { $gte: since, $lte: end } }).select('date prayers'),
    ZikrDaily.aggregate([
      { $match: { userId, date: { $gte: new Date(since + 'T00:00:00.000Z') } } },
      { $group: { _id: '$date', total: { $sum: '$count' } } },
    ]) as Promise<Array<{ _id: Date; total: number }>>,
    QuranLog.find({ userId, date: { $gte: since, $lte: end } }).select('date pages'),
    FastingLog.find({ userId, status: 'completed', date: { $gte: since, $lte: end } }).select('date'),
    ZikrGoal.findOne({ userId }),
    QuranProfile.findOne({ userId }).select('dailyGoalPages'),
  ]);

  const zikrGoal = zikrGoalDoc?.dailyTarget ?? 100;
  const quranGoal = quranProfile?.dailyGoalPages ?? 2;

  const salatByDay = new Map<string, number>();
  for (const log of salatLogs) {
    let done = 0;
    for (const pid of PRAYER_IDS) {
      const st = log.prayers[pid]?.status;
      if (st === 'completed' || st === 'kaza') done++;
    }
    salatByDay.set(log.date, done);
  }
  const zikrByDay = new Map<string, number>();
  for (const r of zikrRows) {
    // Bucket convention: the UTC date part equals the user's local date
    const k = new Date(r._id).toISOString().split('T')[0] ?? '';
    zikrByDay.set(k, (zikrByDay.get(k) ?? 0) + r.total);
  }
  const quranByDay = new Map(quranLogs.map((l) => [l.date, l.pages]));
  const fastDays = new Set(fastLogs.map((l) => l.date));

  const allDays = new Set<string>([
    ...salatByDay.keys(), ...zikrByDay.keys(), ...quranByDay.keys(), ...fastDays,
  ]);

  let allTime = 0;
  for (const day of allDays) {
    const salatPts = Math.min(5, salatByDay.get(day) ?? 0) * 10;
    const zikrPts = Math.round(Math.min(1, (zikrByDay.get(day) ?? 0) / zikrGoal) * 20);
    const quranPts = Math.round(Math.min(1, (quranByDay.get(day) ?? 0) / quranGoal) * 20);
    const fastPts = fastDays.has(day) ? 10 : 0;
    allTime += salatPts + zikrPts + quranPts + fastPts;
  }

  return { today: me.score, allTime };
}
