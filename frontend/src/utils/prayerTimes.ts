import * as adhan from 'adhan';

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  sunset: Date;
}

export interface ForbiddenWindow {
  label: string;
  note: string;
  start: Date;
  end: Date;
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
  // sunset: adhan exposes it; fall back to maghrib if missing
  const sunset: Date = (times as unknown as { sunset?: Date }).sunset ?? times.maghrib;
  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
    sunset,
  };
}

/**
 * Returns the three makrooh (forbidden) prayer windows for the day.
 * 1. Around sunrise: from sunrise until 20 minutes after
 * 2. Solar zenith (istiwa): from 10 minutes before Dhuhr until Dhuhr begins
 * 3. After Asr: from Asr until Maghrib
 */
export function getForbiddenWindows(times: PrayerTimesResult): ForbiddenWindow[] {
  const MIN = 60_000;
  return [
    {
      label: 'Around Sunrise',
      note: 'Do not pray at sunrise itself',
      start: times.sunrise,
      end: new Date(times.sunrise.getTime() + 20 * MIN),
    },
    {
      label: 'Solar Zenith (Istiwa)',
      note: 'Sun directly overhead — just before Dhuhr',
      start: new Date(times.dhuhr.getTime() - 10 * MIN),
      end: times.dhuhr,
    },
    {
      // The forbidden window is the ~17 minutes when the sun visibly descends and turns yellow.
      // This is the "time of sunset" described in the hadith — not the full period from Asr.
      // Reference: "At three times … when it is about to set." — Ṣaḥīḥ Muslim 831
      label: 'Forbidden — At Sunset',
      note: 'Prayer is forbidden during the ~17 minutes the sun is visibly setting (turning yellow and descending). This is the actual "time of sunset" mentioned in the hadith. You may perform nafl between Asr and this window. Maghrib begins shortly after sunset.',
      start: new Date(times.sunset.getTime() - 17 * MIN),
      end: times.sunset,
    },
  ];
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export interface NaflWindow {
  name: string;
  icon: string;
  start: Date;
  end: Date;
}

/**
 * Returns the currently active nafl (voluntary) prayer window, if any.
 * Windows (non-overlapping, in daily order):
 *  1. Tahajjud — last third of night until 30 min before Fajr
 *  2. Ishraq   — 20–45 min after sunrise
 *  3. Dhuha    — 45 min after sunrise until 15 min before Dhuhr
 *  4. Awabeen  — after Maghrib until Isha
 */
export function getCurrentNaflWindow(times: PrayerTimesResult, now: Date = new Date()): NaflWindow | null {
  const MIN = 60_000;
  const { fajr, sunrise, dhuhr, maghrib, isha } = times;
  const nextDayFajr = new Date(fajr.getTime() + 86_400_000);

  // Tahajjud: last third of night → 30 min before Fajr
  const nightDuration = nextDayFajr.getTime() - isha.getTime();
  const tahajjudStart = new Date(isha.getTime() + (2 / 3) * nightDuration);
  const tahajjudEnd   = new Date(fajr.getTime() - 30 * MIN);
  if (now >= tahajjudStart && now < tahajjudEnd) {
    return { name: 'Tahajjud', icon: '🌙', start: tahajjudStart, end: tahajjudEnd };
  }

  // Ishraq: 20–45 min after sunrise
  const ishraakStart = new Date(sunrise.getTime() + 20 * MIN);
  const ishraakEnd   = new Date(sunrise.getTime() + 45 * MIN);
  if (now >= ishraakStart && now < ishraakEnd) {
    return { name: 'Ishraq', icon: '🌅', start: ishraakStart, end: ishraakEnd };
  }

  // Dhuha: 45 min after sunrise → 15 min before Dhuhr
  const dhuhaStart = new Date(sunrise.getTime() + 45 * MIN);
  const dhuhaEnd   = new Date(dhuhr.getTime() - 15 * MIN);
  if (now >= dhuhaStart && now < dhuhaEnd) {
    return { name: 'Dhuha', icon: '☀️', start: dhuhaStart, end: dhuhaEnd };
  }

  // Awabeen: 5 min after Maghrib → Isha
  const awabeenStart = new Date(maghrib.getTime() + 5 * MIN);
  if (now >= awabeenStart && now < isha) {
    return { name: 'Awabeen', icon: '🌆', start: awabeenStart, end: isha };
  }

  return null;
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
