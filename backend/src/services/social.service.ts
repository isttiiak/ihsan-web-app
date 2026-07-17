import SocialProfile, { generateInviteCode, ISocialProfile, MAX_FRIENDS } from '../models/SocialProfile.js';
import User from '../models/User.js';
import SalatLog, { PRAYER_IDS } from '../models/SalatLog.js';
import FastingLog from '../models/FastingLog.js';
import QuranLog from '../models/QuranLog.js';
import QuranProfile from '../models/QuranProfile.js';
import ZikrGoal from '../models/ZikrGoal.js';
import ZikrDaily from '../models/ZikrDaily.js';
import { getStreakStatus } from './streak.service.js';
import { getExcusedSet, getExcusedIntervals } from './cycle.service.js';
import { DEFAULT_TIMEZONE_OFFSET, bucketDateForDayString } from '../utils/timezone-flexible.js';

/** Zikr type names that count as salawat/istighfar for the excused-day Noor */
const SALAWAT_RE = /(salawat|ṣalawāt|durud|darood|salat.?.?ala|istighfar|astaghfir)/i;

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
    const now = new Date();
    // Mutual connection, atomic on each side — record the join date for both
    await Promise.all([
      SocialProfile.updateOne(
        { userId },
        { $addToSet: { friends: owner.userId }, $set: { [`friendSince.${owner.userId}`]: now } }
      ),
      SocialProfile.updateOne(
        { userId: owner.userId },
        { $addToSet: { friends: userId }, $set: { [`friendSince.${userId}`]: now } }
      ),
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
    SocialProfile.updateOne(
      { userId },
      { $pull: { friends: friendUid }, $unset: { [`friendSince.${friendUid}`]: '' } }
    ),
    SocialProfile.updateOne(
      { userId: friendUid },
      { $pull: { friends: userId }, $unset: { [`friendSince.${userId}`]: '' } }
    ),
  ]);
  return { ok: true };
}

// ─── Friends list (manage view) ──────────────────────────────────────────────

export interface FriendListItem {
  uid: string;
  displayName: string;
  photoUrl?: string;
  /** ISO date the friendship began; null for connections made before this field existed */
  connectedSince: string | null;
}

export async function getFriendsList(userId: string): Promise<FriendListItem[]> {
  const profile = await getOrCreateProfile(userId);
  if (profile.friends.length === 0) return [];

  const users = await User.find({ uid: { $in: profile.friends } }).select('uid displayName photoUrl');
  const byUid = new Map(users.map((u) => [u.uid, u]));

  const list = profile.friends.map((uid) => {
    const u = byUid.get(uid);
    const photo = u?.photoUrl;
    const since = profile.friendSince?.get(uid);
    return {
      uid,
      displayName: u?.displayName || 'Ihsan user',
      ...(photo && /^https?:\/\//.test(photo) ? { photoUrl: photo } : {}),
      connectedSince: since ? since.toISOString() : null,
    };
  });

  // Newest connections first; undated (legacy) connections last
  list.sort((a, b) => {
    if (!a.connectedSince && !b.connectedSince) return a.displayName.localeCompare(b.displayName);
    if (!a.connectedSince) return 1;
    if (!b.connectedSince) return -1;
    return b.connectedSince.localeCompare(a.connectedSince);
  });

  return list;
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

/**
 * Excused-day Noor (Rayhanah Cycle) — same max 100, built from what remains
 * fully open during hayd/nifas (dhikr, Quran listening, salawat/istighfar):
 *   up to 40 — today's zikr vs the daily goal (proportional)
 *   up to 20 — zikr streak (2/day, cap 10 days — zikr is never interrupted)
 *   up to 30 — Quran engagement (listening counts) vs the daily goal
 *   +10      — any salawat/istighfar dhikr today
 * PRIVACY: identical shape to the normal score; no flag ever leaves the
 * server, and the visible chips are filled from these same real acts so a
 * friend cannot distinguish an excused day from an ordinary one.
 */
function computeExcusedScore(input: {
  zikrToday: number;
  zikrGoal: number;
  zikrStreak: number;
  quranPagesToday: number;
  quranGoal: number;
  salawatDone: boolean;
}): number {
  const zikrPts = Math.round(Math.min(1, input.zikrGoal > 0 ? input.zikrToday / input.zikrGoal : 0) * 40);
  const streakPts = Math.min(10, input.zikrStreak) * 2;
  const quranPts = Math.round(Math.min(1, input.quranGoal > 0 ? input.quranPagesToday / input.quranGoal : 0) * 30);
  const salawatPts = input.salawatDone ? 10 : 0;
  return zikrPts + streakPts + quranPts + salawatPts;
}

async function statsForUser(
  uid: string,
  viewerUid: string,
  today: string,
  timezoneOffset: number,
  excusedToday = false
): Promise<FriendStats> {
  const monthStart = today.substring(0, 8) + '01';
  const quranSince = shiftDateStr(today, -30);

  const [user, zikr, salatLog, fastsThisMonth, todayFastLog, quranLogs, quranProfile] = await Promise.all([
    User.findOne({ uid }).select('displayName photoUrl'),
    getStreakStatus(uid, timezoneOffset, today),
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

  let score = computeScore(base);

  if (excusedToday) {
    // Rayhanah Cycle substitution. Check for salawat/istighfar in today's
    // per-type buckets, score from the permitted acts, then fill the salat
    // and fasting chips from that same real effort so the row looks like any
    // other active day (Istiak's spec: nothing may reveal an excused day).
    const bucket = bucketDateForDayString(today, timezoneOffset);
    const todayTypes = bucket
      ? await ZikrDaily.find({ userId: uid, date: bucket }).select('zikrType count')
      : [];
    const salawatDone = todayTypes.some((t) => SALAWAT_RE.test(t.zikrType) && t.count > 0);

    score = computeExcusedScore({
      zikrToday: base.zikrToday,
      zikrGoal: base.zikrGoal,
      zikrStreak: base.zikrStreak,
      quranPagesToday: base.quranPagesToday,
      quranGoal: base.quranGoal,
      salawatDone,
    });
    base.salatToday = Math.round(5 * Math.min(1, score / 100));
    base.fastedToday = base.zikrGoalMet;
  }

  const photo = user?.photoUrl;
  return {
    uid,
    displayName: user?.displayName || 'Ihsan user',
    ...(photo && /^https?:\/\//.test(photo) ? { photoUrl: photo } : {}),
    ...base,
    score,
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
  const excused = await getExcusedSet(uids, end);
  const stats = await Promise.all(
    uids.map((uid) => statsForUser(uid, userId, end, timezoneOffset, excused.has(uid)))
  );

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

  const excusedIntervals = await getExcusedIntervals(userId);
  const isExcusedDay = (day: string): boolean =>
    excusedIntervals.some((iv) => iv.start <= day && (iv.end === null ? day <= end : day <= iv.end));

  const [me, salatLogs, zikrRows, quranLogs, fastLogs, zikrGoalDoc, quranProfile] = await Promise.all([
    statsForUser(userId, userId, end, timezoneOffset, isExcusedDay(end)),
    SalatLog.find({ userId, date: { $gte: since, $lte: end } }).select('date prayers'),
    ZikrDaily.aggregate([
      { $match: { userId, date: { $gte: new Date(since + 'T00:00:00.000Z') } } },
      {
        $group: {
          _id: '$date',
          total: { $sum: '$count' },
          salawat: {
            $sum: {
              $cond: [
                { $regexMatch: { input: '$zikrType', regex: 'salawat|durud|darood|istighfar|astaghfir', options: 'i' } },
                '$count',
                0,
              ],
            },
          },
        },
      },
    ]) as Promise<Array<{ _id: Date; total: number; salawat: number }>>,
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
  const salawatByDay = new Map<string, number>();
  for (const r of zikrRows) {
    // Bucket convention: the UTC date part equals the user's local date
    const k = new Date(r._id).toISOString().split('T')[0] ?? '';
    zikrByDay.set(k, (zikrByDay.get(k) ?? 0) + r.total);
    salawatByDay.set(k, (salawatByDay.get(k) ?? 0) + (r.salawat ?? 0));
  }
  const quranByDay = new Map(quranLogs.map((l) => [l.date, l.pages]));
  const fastDays = new Set(fastLogs.map((l) => l.date));

  const allDays = new Set<string>([
    ...salatByDay.keys(), ...zikrByDay.keys(), ...quranByDay.keys(), ...fastDays,
  ]);

  let allTime = 0;
  for (const day of allDays) {
    if (isExcusedDay(day)) {
      // Rayhanah Cycle day — reward the acts that remained open (max 100):
      // zikr 50 · Quran (listening) 40 · salawat/istighfar 10
      const zikrPts = Math.round(Math.min(1, (zikrByDay.get(day) ?? 0) / zikrGoal) * 50);
      const quranPts = Math.round(Math.min(1, (quranByDay.get(day) ?? 0) / quranGoal) * 40);
      const salawatPts = (salawatByDay.get(day) ?? 0) > 0 ? 10 : 0;
      allTime += zikrPts + quranPts + salawatPts;
      continue;
    }
    const salatPts = Math.min(5, salatByDay.get(day) ?? 0) * 10;
    const zikrPts = Math.round(Math.min(1, (zikrByDay.get(day) ?? 0) / zikrGoal) * 20);
    const quranPts = Math.round(Math.min(1, (quranByDay.get(day) ?? 0) / quranGoal) * 20);
    const fastPts = fastDays.has(day) ? 10 : 0;
    allTime += salatPts + zikrPts + quranPts + fastPts;
  }

  return { today: me.score, allTime };
}
