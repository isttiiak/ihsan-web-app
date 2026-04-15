import * as adhan from 'adhan';

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface PrayerInfo {
  id: PrayerKey;
  name: string;
  icon: string;
  isTrackable: boolean; // sunrise is not a salat
}

export const PRAYER_META: PrayerInfo[] = [
  { id: 'fajr',    name: 'Fajr',    icon: '🌅', isTrackable: true },
  { id: 'sunrise', name: 'Sunrise', icon: '🌄', isTrackable: false },
  { id: 'dhuhr',   name: 'Dhuhr',   icon: '☀️', isTrackable: true },
  { id: 'asr',     name: 'Asr',     icon: '🌤️', isTrackable: true },
  { id: 'maghrib', name: 'Maghrib', icon: '🌆', isTrackable: true },
  { id: 'isha',    name: 'Isha',    icon: '🌙', isTrackable: true },
];

export function calcPrayerTimes(lat: number, lng: number, date: Date = new Date()): PrayerTimesResult {
  const coords = new adhan.Coordinates(lat, lng);
  const params = adhan.CalculationMethod.MoonsightingCommittee(); // worldwide-friendly
  const times = new adhan.PrayerTimes(coords, date, params);
  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/** Returns the current prayer period and the next upcoming prayer */
export function getCurrentAndNextPrayer(times: PrayerTimesResult, now: Date = new Date()) {
  const ordered: { id: PrayerKey; time: Date }[] = [
    { id: 'fajr',    time: times.fajr },
    { id: 'sunrise', time: times.sunrise },
    { id: 'dhuhr',   time: times.dhuhr },
    { id: 'asr',     time: times.asr },
    { id: 'maghrib', time: times.maghrib },
    { id: 'isha',    time: times.isha },
  ];

  let current: PrayerKey = 'isha'; // default: after isha, still "isha time"
  let nextIdx = 0;

  for (let i = 0; i < ordered.length; i++) {
    if (now >= ordered[i].time) {
      current = ordered[i].id;
    } else {
      nextIdx = i;
      break;
    }
    if (i === ordered.length - 1) {
      // Past isha — next prayer is tomorrow's fajr
      nextIdx = -1;
    }
  }

  const next = nextIdx === -1
    ? { id: 'fajr' as PrayerKey, time: new Date(times.fajr.getTime() + 86400_000) }
    : ordered[nextIdx];

  const msUntilNext = next.time.getTime() - now.getTime();
  const totalSec = Math.max(0, Math.floor(msUntilNext / 1000));
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;

  return { current, next: next.id, nextTime: next.time, hh, mm, ss };
}
