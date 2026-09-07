import webpush from 'web-push';
import PushSubscription, {
  IPushCategories,
  IPushSubscription,
} from '../models/PushSubscription.js';
import User from '../models/User.js';
import { getStreakStatus } from './streak.service.js';
import { getAnalyticsData } from './analytics.service.js';
import {
  getLocalDate,
  getTodayString,
  DEFAULT_TIMEZONE_OFFSET,
} from '../utils/timezone-flexible.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

const DEFAULT_CATEGORIES: IPushCategories = {
  streakAtRisk: true,
  adhkarWindows: true,
  weeklySummary: true,
  adhan: false,
};

interface SubscribeInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  categories?: Partial<IPushCategories>;
  timezoneOffset?: number;
  location?: { lat: number; lng: number };
}

export async function subscribe(
  userId: string,
  input: SubscribeInput,
  userAgent?: string
): Promise<void> {
  const setOps: Record<string, unknown> = {
    userId,
    keys: input.keys,
    userAgent,
    lastSeenAt: new Date(),
  };
  if (input.categories) {
    for (const [key, value] of Object.entries(input.categories)) {
      if (value !== undefined) setOps[`categories.${key}`] = value;
    }
  }

  await PushSubscription.findOneAndUpdate(
    { endpoint: input.endpoint },
    { $set: setOps },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Opportunistic — piggybacks on the subscribe call since the client already
  // has these values handy (getUserTimezoneOffset(), the saved ihsan_location
  // — never a fresh geolocation prompt). Never blocks subscribe on failure.
  if (input.timezoneOffset !== undefined || input.location) {
    await User.updateOne(
      { uid: userId },
      {
        $set: {
          ...(input.timezoneOffset !== undefined ? { timezoneOffset: input.timezoneOffset } : {}),
          ...(input.location ? { location: input.location } : {}),
        },
      }
    );
  }
}

export async function unsubscribe(endpoint: string): Promise<void> {
  await PushSubscription.deleteOne({ endpoint });
}

/** Applies to every device the user has subscribed from — category prefs are
 * shown as one user-level settings panel, not per-device. */
export async function updatePreferences(
  userId: string,
  categories: Partial<IPushCategories>
): Promise<void> {
  const setOps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(categories)) {
    if (value !== undefined) setOps[`categories.${key}`] = value;
  }
  if (Object.keys(setOps).length === 0) return;
  await PushSubscription.updateMany({ userId }, { $set: setOps });
}

export async function getPreferences(userId: string): Promise<IPushCategories> {
  const sub = await PushSubscription.findOne({ userId }).sort({ createdAt: 1 });
  return sub ? sub.categories : DEFAULT_CATEGORIES;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  return (await PushSubscription.exists({ userId })) !== null;
}

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

async function sendToSubscription(sub: IPushSubscription, payload: PushPayload): Promise<void> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(payload)
    );
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      // Dead-subscription reaper: the browser/OS revoked it, or the user
      // uninstalled/cleared site data. Any other error (network blip, 429) is
      // left alone — tomorrow's run retries it naturally.
      await PushSubscription.deleteOne({ _id: sub._id });
    }
  }
}

// Evening-only window, in each user's OWN local time. This is the one honest
// compromise of running on Vercel Hobby's once-a-day cron (see vercel.json):
// a single fixed-UTC-time invocation cannot land in "evening" for every
// timezone at once. A user whose local hour never falls in this window when
// the cron fires (fixed daily, see vercel.json's schedule) won't get an
// evening nudge at all this iteration — most of Ihsan's userbase is near the
// app's default timezone (UTC+6), which this window is tuned for. Revisit
// with a higher-frequency cron (Vercel Pro) rather than widening this window.
const EVENING_WINDOW = { startHour: 17, endHour: 22 };
const WEEKLY_SUMMARY_DOW = 5; // Friday

/**
 * Entry point for the daily Vercel Cron job (see routes/cron.routes.ts).
 * Iterates every user with at least one push subscription and decides, from
 * THEIR local time (via the timezoneOffset opportunistically captured at
 * subscribe-time — see User.timezoneOffset), whether this run falls in their
 * evening window and/or is their weekly-summary day.
 *
 * Deliberately sequential (not batched/parallel) — matches the app's existing
 * "don't add complexity for a scale problem that doesn't exist yet" stance
 * (see TODO-v2.md's analytics-caching investigation). Revisit if the user
 * count ever gets large enough to risk the 30s serverless maxDuration.
 */
export async function runDailyPushCheck(): Promise<{ checked: number; sent: number }> {
  const userIds = await PushSubscription.distinct('userId');
  let sent = 0;

  for (const userId of userIds) {
    const [user, subs] = await Promise.all([
      User.findOne({ uid: userId }).select('timezoneOffset').lean<{ timezoneOffset?: number }>(),
      PushSubscription.find({ userId }),
    ]);
    if (subs.length === 0) continue;

    const offset = user?.timezoneOffset ?? DEFAULT_TIMEZONE_OFFSET;
    const localNow = getLocalDate(Date.now(), offset);
    const localHour = localNow.getUTCHours();
    const localDow = localNow.getUTCDay(); // 0=Sun .. 6=Sat
    const todayStr = getTodayString(offset);

    let streakPayload: PushPayload | null = null;
    let adhkarPayload: PushPayload | null = null;
    let weeklyPayload: PushPayload | null = null;

    const inEveningWindow =
      localHour >= EVENING_WINDOW.startHour && localHour < EVENING_WINDOW.endHour;
    if (inEveningWindow) {
      // streak-at-risk and the generic adhkar nudge are mutually exclusive —
      // both are "come do dhikr" prompts, so sending both the same evening
      // would just be spammy repetition of the same ask.
      const status = await getStreakStatus(userId, offset, todayStr);
      if (!status.isPaused && status.currentStreak > 0 && !status.goalMet) {
        streakPayload =
          status.state === 'grace'
            ? {
                title: "Your streak's last chance is today",
                body: `You're at ${status.todayTotal}/${status.dailyTarget} — a little more keeps your ${status.currentStreak}-day streak alive.`,
                url: '/zikr',
              }
            : {
                title: 'Your streak is waiting',
                body: `You're at ${status.todayTotal}/${status.dailyTarget} today — keep the ${status.currentStreak}-day streak going.`,
                url: '/zikr',
              };
      } else {
        adhkarPayload = {
          title: 'A moment for dhikr',
          body: 'Evening is a beautiful time to remember Allah — open Ihsan for a few tasbih.',
          url: '/zikr',
        };
      }

      if (localDow === WEEKLY_SUMMARY_DOW) {
        const week = await getAnalyticsData(userId, 7, offset, todayStr);
        if (week.stats.total > 0) {
          weeklyPayload = {
            title: 'Your week with Ihsan',
            body: `You logged ${week.stats.total} this week, averaging ${Math.round(week.stats.average)}/day.`,
            url: '/zikr/analytics',
          };
        }
      }
    }

    for (const sub of subs) {
      if (sub.categories.streakAtRisk && streakPayload) {
        await sendToSubscription(sub, streakPayload);
        sent++;
      } else if (sub.categories.adhkarWindows && adhkarPayload) {
        await sendToSubscription(sub, adhkarPayload);
        sent++;
      }
      if (sub.categories.weeklySummary && weeklyPayload) {
        await sendToSubscription(sub, weeklyPayload);
        sent++;
      }
    }
  }

  return { checked: userIds.length, sent };
}
