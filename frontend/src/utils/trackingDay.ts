// The Ihsan TRACKING DAY — the app's day boundary is FAJR, not midnight
// (Istiak's spec, 2026-07-18). A new worship day begins at the local Fajr
// time: Isha prayed at 1 AM and tahajjud/suhoor before dawn belong to the
// CLOSING day, matching the rhythm of ibadah.
//
// Every "today" the app sends to the server (zikr buckets, salat/fasting/
// quran/social date strings) must come from getTrackingDay() — never from
// raw new Date() / getTodayLocal().
//
// Fallback: Fajr needs coordinates. Users who haven't set a location
// (localStorage `ihsan_location`) keep the civil-midnight boundary until
// they do.
import { calcPrayerTimes } from './prayerTimes.js';

interface StoredLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

function readLocation(): StoredLocation | null {
  try {
    const raw = localStorage.getItem('ihsan_location');
    if (!raw) return null;
    const loc = JSON.parse(raw) as StoredLocation;
    if (typeof loc?.latitude !== 'number' || typeof loc?.longitude !== 'number') return null;
    return loc;
  } catch {
    return null;
  }
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Local Fajr time for the civil date of `date`, or null without a location. */
export function getFajrTime(date: Date = new Date()): Date | null {
  const loc = readLocation();
  if (!loc) return null;
  try {
    return calcPrayerTimes(loc.latitude, loc.longitude, date).fajr;
  } catch {
    return null;
  }
}

/**
 * The current tracking day as YYYY-MM-DD.
 * Before today's Fajr → still yesterday's tracking day.
 * Without a saved location → civil date (midnight boundary).
 */
export function getTrackingDay(now: Date = new Date()): string {
  const fajr = getFajrTime(now);
  if (fajr && now < fajr) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return toYMD(yesterday);
  }
  return toYMD(now);
}

/**
 * A timestamp safely INSIDE the current tracking day for server-side day
 * bucketing (12:00 local of the tracking day's civil date). Zikr flushes
 * anchor increments with this so a 1 AM tap lands in the closing day's
 * bucket, not the next civil day's.
 */
export function getTrackingDayMiddayTs(now: Date = new Date()): number {
  const [y, m, d] = getTrackingDay(now).split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
}

export function isNewTrackingDay(lastDateString: string | null): boolean {
  return getTrackingDay() !== lastDateString;
}
