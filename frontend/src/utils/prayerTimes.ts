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

  // ── Tahajjud: last third of night → 30 min before Fajr ─────────────────────
  const tahajjudEnd = new Date(fajr.getTime() - 30 * MIN);
  if (now < fajr) {
    // Early morning (after midnight, before Fajr): use last night's Tahajjud window.
    // Approximate yesterday's Isha as today's Isha −24 h (shifts <2 min/day — acceptable).
    const prevIsha = new Date(isha.getTime() - 86_400_000);
    const nightDuration = fajr.getTime() - prevIsha.getTime();
    const tahajjudStart = new Date(prevIsha.getTime() + (2 / 3) * nightDuration);
    if (now >= tahajjudStart && now < tahajjudEnd) {
      return { name: 'Tahajjud', icon: '🌙', start: tahajjudStart, end: tahajjudEnd };
    }
  } else {
    // After Fajr: check tonight's upcoming Tahajjud (starts after tonight's Isha)
    const nextDayFajr = new Date(fajr.getTime() + 86_400_000);
    const nightDuration = nextDayFajr.getTime() - isha.getTime();
    const tahajjudStart = new Date(isha.getTime() + (2 / 3) * nightDuration);
    const nextTahajjudEnd = new Date(nextDayFajr.getTime() - 30 * MIN);
    if (now >= tahajjudStart && now < nextTahajjudEnd) {
      return { name: 'Tahajjud', icon: '🌙', start: tahajjudStart, end: nextTahajjudEnd };
    }
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

// ── Mandatory prayer widget helpers ─────────────────────────────────────────

/** End time of each mandatory prayer period */
export function getPrayerEndTime(prayer: PrayerKey, times: PrayerTimesResult): Date {
  const MIN = 60_000;
  switch (prayer) {
    case 'fajr':    return times.sunrise;
    case 'dhuhr':   return times.asr;
    case 'asr':     return new Date(times.sunset.getTime() - 17 * MIN);
    case 'maghrib': return times.isha;
    case 'isha': {
      const nextFajr = new Date(times.fajr.getTime() + 86_400_000);
      // Best to complete before midnight (midpoint between Isha & next Fajr)
      return new Date((times.isha.getTime() + nextFajr.getTime()) / 2);
    }
    default: return times.fajr;
  }
}

/** Current mandatory prayer period (null if between periods or in a forbidden window) */
function getCurrentMandatoryPeriod(times: PrayerTimesResult, now: Date): PrayerKey | null {
  const asrEnd = getPrayerEndTime('asr', times);
  if (now >= times.fajr    && now < times.sunrise) return 'fajr';
  if (now >= times.dhuhr   && now < times.asr)     return 'dhuhr';
  if (now >= times.asr     && now < asrEnd)         return 'asr';
  if (now >= times.maghrib && now < times.isha)     return 'maghrib';
  if (now >= times.isha)                            return 'isha';
  return null;
}

/** Next mandatory prayer (fajr/dhuhr/asr/maghrib/isha), wraps to tomorrow's fajr */
function getNextMandatoryPrayer(times: PrayerTimesResult, now: Date): { id: PrayerKey; time: Date } {
  const ordered: { id: PrayerKey; time: Date }[] = [
    { id: 'fajr',    time: times.fajr },
    { id: 'dhuhr',   time: times.dhuhr },
    { id: 'asr',     time: times.asr },
    { id: 'maghrib', time: times.maghrib },
    { id: 'isha',    time: times.isha },
  ];
  for (const p of ordered) {
    if (now < p.time) return p;
  }
  return { id: 'fajr', time: new Date(times.fajr.getTime() + 86_400_000) };
}

export interface MandatoryWidgetData {
  forbiddenWindow:     ForbiddenWindow | null;
  currentMandatory:    PrayerKey | null;
  currentMandatoryEnd: Date | null;
  naflWindow:          NaflWindow | null;
  nextMandatory:       PrayerKey;
  nextMandatoryTime:   Date;
  nextHh: number; nextMm: number; nextSs: number;
}

/** All data needed by the compact prayer widget on the Home page */
export function getMandatoryWidget(times: PrayerTimesResult, now: Date = new Date()): MandatoryWidgetData {
  const forbidden       = getForbiddenWindows(times);
  const forbiddenWindow = forbidden.find((w) => now >= w.start && now < w.end) ?? null;

  const currentMandatory    = getCurrentMandatoryPeriod(times, now);
  const currentMandatoryEnd = currentMandatory ? getPrayerEndTime(currentMandatory, times) : null;
  const naflWindow          = getCurrentNaflWindow(times, now);

  const next     = getNextMandatoryPrayer(times, now);
  const ms       = Math.max(0, next.time.getTime() - now.getTime());
  const totalSec = Math.floor(ms / 1000);

  return {
    forbiddenWindow,
    currentMandatory,
    currentMandatoryEnd,
    naflWindow,
    nextMandatory:     next.id,
    nextMandatoryTime: next.time,
    nextHh: Math.floor(totalSec / 3600),
    nextMm: Math.floor((totalSec % 3600) / 60),
    nextSs: totalSec % 60,
  };
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
