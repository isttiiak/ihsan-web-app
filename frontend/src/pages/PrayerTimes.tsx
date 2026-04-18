import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { MapPinIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import {
  calcPrayerTimes,
  formatTime,
  getCurrentAndNextPrayer,
  getPrayerEndTime,
  PRAYER_META,
  PrayerTimesResult,
  PrayerKey,
} from '../utils/prayerTimes.js';
import { getHijriDate, formatHijriDate } from '../utils/islamicCalendar.js';

// ─── Timeline types ───────────────────────────────────────────────────────────

interface PrayerTLEntry {
  kind: 'prayer';
  id: string;
  name: string;
  icon: string;
  time: Date;
  endTime?: Date;
  isTrackable: boolean;
}
interface EventTLEntry {
  kind: 'event';
  label: string;
  icon: string;
  time: Date;
  note: string;
}
interface ForbiddenTLEntry {
  kind: 'forbidden';
  label: string;
  note: string;
  hadith: string;
  hadithUrl: string;
  start: Date;
  end: Date;
}
interface NaflTLEntry {
  kind: 'nafl';
  label: string;
  arabicName: string;
  note: string;
  hadith: string;
  hadithUrl: string;
  icon: string;
  start: Date;
  end: Date;
}
type TLEntry = PrayerTLEntry | EventTLEntry | ForbiddenTLEntry | NaflTLEntry;

function entryTime(e: TLEntry): number {
  return e.kind === 'prayer' || e.kind === 'event' ? e.time.getTime() : e.start.getTime();
}

function buildTimeline(times: PrayerTimesResult): TLEntry[] {
  const MIN = 60_000;
  const fajrNext = new Date(times.fajr.getTime() + 24 * 60 * MIN);
  const nightDuration = fajrNext.getTime() - times.isha.getTime();
  const tahajjudStart = new Date(times.isha.getTime() + (nightDuration * 2) / 3);

  const entries: TLEntry[] = [
    // ── Fajr ──────────────────────────────────────────────────────────────
    {
      kind: 'prayer',
      id: 'fajr', name: 'Fajr', icon: '🌅', isTrackable: true,
      time: times.fajr, endTime: getPrayerEndTime('fajr' as PrayerKey, times),
    },

    // ── Forbidden: Around Sunrise ─────────────────────────────────────────
    {
      kind: 'forbidden',
      label: 'Forbidden — Around Sunrise',
      note: 'Prayer is not allowed from sunrise until ~20 min after the sun has fully cleared the horizon.',
      hadith: '"There is no prayer after the morning prayer until the sun rises." — Ṣaḥīḥ al-Bukhārī 581; "At three times the Prophet ﷺ forbade us to pray: when the sun begins to rise … when it is at its zenith … and when it is about to set." — Ṣaḥīḥ Muslim 831',
      hadithUrl: 'https://sunnah.com/bukhari:581',
      start: times.sunrise,
      end: new Date(times.sunrise.getTime() + 20 * MIN),
    },

    // ── Nafl: Ishraq / Duha ──────────────────────────────────────────────
    {
      kind: 'nafl',
      label: 'Ṣalāt al-Ishrāq / Ḍuḥā',
      arabicName: 'صلاة الإشراق / صلاة الضحى',
      note: '2–8 voluntary rak\'ahs. Best time is when the sun has risen well (Ishraq ≈ 20 min after sunrise). Duha can continue until just before the solar zenith. Immense reward equivalent to Ḥajj and \'Umrah.',
      hadith: '"Whoever prays Fajr in congregation, then sits remembering Allah until the sun rises, then prays two rak\'ahs — he will have a reward like that of Ḥajj and \'Umrah, complete, complete, complete." — Tirmidhī 586; Duha: "The Prophet ﷺ used to pray Duha four rak\'ahs and would add more as Allah willed." — Ṣaḥīḥ Muslim 717',
      hadithUrl: 'https://sunnah.com/tirmidhi:586',
      icon: '🌤️',
      start: new Date(times.sunrise.getTime() + 20 * MIN),
      end: new Date(times.dhuhr.getTime() - 10 * MIN),
    },

    // ── Forbidden: Istiwa (Solar Zenith) ──────────────────────────────────
    {
      kind: 'forbidden',
      label: 'Forbidden — Istiwa\' (Solar Zenith)',
      note: 'The sun is directly overhead (~10 min before Dhuhr). Prayer is forbidden until Dhuhr time begins.',
      hadith: '"At three times the Prophet ﷺ forbade us to pray … when it is at its zenith." — Ṣaḥīḥ Muslim 831; Ibn \'Umar: "Do not pray when the sun is rising, nor when it is setting, nor when it is at its peak (zenith)." — Ṣaḥīḥ al-Bukhārī 585',
      hadithUrl: 'https://sunnah.com/muslim:831',
      start: new Date(times.dhuhr.getTime() - 10 * MIN),
      end: times.dhuhr,
    },

    // ── Dhuhr ─────────────────────────────────────────────────────────────
    {
      kind: 'prayer',
      id: 'dhuhr', name: 'Dhuhr', icon: '☀️', isTrackable: true,
      time: times.dhuhr, endTime: getPrayerEndTime('dhuhr' as PrayerKey, times),
    },

    // ── Asr ───────────────────────────────────────────────────────────────
    {
      kind: 'prayer',
      id: 'asr', name: 'Asr', icon: '🌤️', isTrackable: true,
      time: times.asr, endTime: getPrayerEndTime('asr' as PrayerKey, times),
    },

    // ── Forbidden: ~17 min before sunset ─────────────────────────────────
    // The "forbidden time at sunset" is the ~17 minutes when the sun visibly
    // descends and turns yellow — NOT the full period from Asr to sunset.
    // Between Asr and this window, nafl prayer is permitted.
    {
      kind: 'forbidden',
      label: 'Forbidden — At Sunset',
      note: 'Prayer is forbidden during the ~17 minutes the sun visibly sets (turns yellow and descends to the horizon). This is the "time of sunset" mentioned in the hadith. Nafl is allowed between Asr and this window. Obligatory (qaḍā) make-up prayers are permitted. Maghrib begins shortly after sunset.',
      hadith: '"At three times the Prophet ﷺ forbade us to pray: … when it is about to set." — Ṣaḥīḥ Muslim 831; Ṣaḥīḥ al-Bukhārī 586',
      hadithUrl: 'https://sunnah.com/muslim:831',
      start: new Date(times.sunset.getTime() - 17 * MIN),
      end: times.sunset,
    },

    // ── Sunset ────────────────────────────────────────────────────────────
    {
      kind: 'event',
      label: 'Sunset — Forbidden Window Ends',
      icon: '🌇',
      time: times.sunset,
      note: 'Sun sets. The sunset forbidden window ends. Maghrib begins shortly after.',
    },

    // ── Maghrib ───────────────────────────────────────────────────────────
    {
      kind: 'prayer',
      id: 'maghrib', name: 'Maghrib', icon: '🌆', isTrackable: true,
      time: times.maghrib, endTime: getPrayerEndTime('maghrib' as PrayerKey, times),
    },

    // ── Nafl: Awwabin ─────────────────────────────────────────────────────
    {
      kind: 'nafl',
      label: 'Ṣalāt al-Awwābīn',
      arabicName: 'صلاة الأوابين',
      note: '2–6 voluntary rak\'ahs between Maghrib and Isha. Recommended for those who often return (awwab) to Allah with remembrance and repentance.',
      hadith: '"Whoever prays six rak\'ahs after Maghrib without speaking anything bad between them, those six rak\'ahs will be counted for him as equivalent to twelve years of worship." — Sunan Ibn Mājah 1167; Abu Hurayrah (RA): "My close friend advised me to pray two rak\'ahs of Duha and not to sleep before praying Witr." — Ṣaḥīḥ al-Bukhārī 1981',
      hadithUrl: 'https://sunnah.com/ibnmajah:1167',
      icon: '⭐',
      start: times.maghrib,
      end: times.isha,
    },

    // ── Isha ──────────────────────────────────────────────────────────────
    {
      kind: 'prayer',
      id: 'isha', name: 'Isha', icon: '🌙', isTrackable: true,
      time: times.isha, endTime: getPrayerEndTime('isha' as PrayerKey, times),
    },

    // ── Nafl: Tahajjud (last third of night) ─────────────────────────────
    {
      kind: 'nafl',
      label: 'Tahajjud',
      arabicName: 'صلاة التهجد',
      note: 'Night prayer in the last third of the night. The most virtuous voluntary prayer after the obligatory ones. 2–12 rak\'ahs; finish with Witr.',
      hadith: '"Our Lord, Blessed and Exalted, descends to the lowest heaven every night in the last third of it, saying: Who is calling upon Me so that I may answer him?" — Ṣaḥīḥ al-Bukhārī 1145, Ṣaḥīḥ Muslim 758. "The best prayer after the obligatory prayers is the night prayer (Tahajjud)." — Ṣaḥīḥ Muslim 1163',
      hadithUrl: 'https://sunnah.com/bukhari:1145',
      icon: '🌙',
      start: tahajjudStart,
      end: fajrNext,
    },
  ];

  return entries.sort((a, b) => entryTime(a) - entryTime(b));
}

// ─── Stored location ──────────────────────────────────────────────────────────

interface StoredLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrayerTimes() {
  const [now, setNow] = useState(new Date());
  const [location, setLocation] = useState<StoredLocation | null>(() => {
    const s = localStorage.getItem('ihsan_location');
    return s ? (JSON.parse(s) as StoredLocation) : null;
  });
  const [times, setTimes] = useState<PrayerTimesResult | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // City search state
  const [cityInput, setCityInput] = useState('');
  const [citySearching, setCitySearching] = useState(false);
  const [cityError, setCityError] = useState('');
  const [showCitySearch, setShowCitySearch] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!location) return;
    setTimes(calcPrayerTimes(location.latitude, location.longitude, now));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, now.toDateString()]);

  const saveLocation = useCallback((loc: StoredLocation) => {
    setLocation(loc);
    localStorage.setItem('ihsan_location', JSON.stringify(loc));
    setShowCitySearch(false);
    setCityInput('');
    setCityError('');
  }, []);

  const requestLocation = useCallback(() => {
    setLocLoading(true);
    setLocError('');
    if (!('geolocation' in navigator)) {
      setLocError('Geolocation not supported — use city search instead.');
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let name = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const d = await r.json() as { address?: { city?: string; town?: string; village?: string; country?: string } };
          const city = d.address?.city ?? d.address?.town ?? d.address?.village;
          const country = d.address?.country;
          if (city || country) name = [city, country].filter(Boolean).join(', ');
        } catch { /* use coords fallback */ }
        saveLocation({ latitude, longitude, name });
        setLocLoading(false);
      },
      (err) => {
        // GPS denied — nudge city search
        setLocError(`GPS denied (${err.message}). Type your city below.`);
        setShowCitySearch(true);
        setLocLoading(false);
      },
      { timeout: 10000 }
    );
  }, [saveLocation]);

  const searchByCity = useCallback(async () => {
    if (!cityInput.trim()) return;
    setCitySearching(true);
    setCityError('');
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&limit=1`
      );
      const results = await r.json() as Array<{ lat: string; lon: string; display_name: string }>;
      if (!results.length) {
        setCityError('City not found. Try a different name.');
        setCitySearching(false);
        return;
      }
      const { lat, lon, display_name } = results[0];
      // Shorten display name to first two parts
      const shortName = display_name.split(',').slice(0, 2).join(',').trim();
      saveLocation({ latitude: parseFloat(lat), longitude: parseFloat(lon), name: shortName });
    } catch {
      setCityError('Search failed. Check your internet connection.');
    }
    setCitySearching(false);
  }, [cityInput, saveLocation]);

  const info = times ? getCurrentAndNextPrayer(times, now) : null;
  const currentMeta = PRAYER_META.find((p) => p.id === info?.current);
  const nextMeta = PRAYER_META.find((p) => p.id === info?.next);

  const timeline = useMemo(() => (times ? buildTimeline(times) : []), [times]);

  // Is current time in a forbidden window?
  const activeForbidden = useMemo(() => {
    return timeline.find(
      (e): e is ForbiddenTLEntry => e.kind === 'forbidden' && now >= e.start && now < e.end
    ) ?? null;
  }, [timeline, now]);

  // Is current time in a nafl window?
  const activeNafl = useMemo(() => {
    return timeline.find(
      (e): e is NaflTLEntry => e.kind === 'nafl' && now >= e.start && now < e.end
    ) ?? null;
  }, [timeline, now]);

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Top row: Location */}
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {location && (
                <div className="flex items-center gap-1.5 text-white/50 text-xs min-w-0">
                  <MapPinIcon className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span className="truncate max-w-[100px] sm:max-w-[160px]">{location.name}</span>
                </div>
              )}
              <button
                onClick={() => { setShowCitySearch(!showCitySearch); setLocError(''); }}
                className="btn btn-xs bg-brand-surface border border-brand-border text-white/50 hover:text-white shrink-0"
              >
                <MapPinIcon className="w-3 h-3" /> {location ? 'Change' : '📍 Set Location'}
              </button>
            </div>
          </div>

          {/* Location panel — shows when no location or user clicks Change */}
          <AnimatePresence>
            {(showCitySearch || !location) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="card bg-brand-surface border border-brand-border rounded-2xl">
                  <div className="card-body p-4 space-y-3">
                    <p className="text-white/60 text-sm font-semibold">
                      {!location ? '📍 Set your location to see prayer times' : '📍 Update location'}
                    </p>

                    {/* Option 1: GPS */}
                    <button
                      onClick={requestLocation}
                      disabled={locLoading}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 hover:border-brand-emerald/60 text-left transition-all"
                    >
                      {locLoading
                        ? <span className="loading loading-spinner loading-xs text-brand-emerald" />
                        : <span className="text-lg">📡</span>
                      }
                      <div>
                        <p className="text-brand-emerald font-semibold text-sm">Use GPS (recommended)</p>
                        <p className="text-white/30 text-xs">Most accurate. Requires browser location permission.</p>
                      </div>
                    </button>
                    {locError && <p className="text-red-400 text-xs">{locError}</p>}

                    {/* Divider */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-brand-border" />
                      <span className="text-white/20 text-xs">or</span>
                      <div className="flex-1 h-px bg-brand-border" />
                    </div>

                    {/* Option 2: City search */}
                    <div>
                      <p className="text-white/40 text-xs mb-2">
                        Search by city — no GPS needed, times are still accurate
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') void searchByCity(); }}
                          placeholder="e.g. Dhaka, London, Karachi…"
                          className="input input-sm flex-1 bg-brand-deep border border-brand-border text-white placeholder-white/20 focus:border-brand-emerald/40 focus:outline-none"
                        />
                        <button
                          onClick={() => void searchByCity()}
                          disabled={citySearching || !cityInput.trim()}
                          className="btn btn-sm bg-brand-emerald hover:bg-brand-emerald-dim text-white border-none"
                        >
                          {citySearching ? <span className="loading loading-spinner loading-xs" /> : 'Search'}
                        </button>
                      </div>
                      {cityError && <p className="text-red-400 text-xs mt-1">{cityError}</p>}
                    </div>

                    <p className="text-white/15 text-xs">
                      Your location is stored only in this browser and never sent to our servers.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-brand-emerald mb-1">Prayer Times</h1>
            <p className="text-white/50 text-sm">
              {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {(() => { const h = getHijriDate(now); return h ? (
              <p className="text-brand-gold/50 text-xs mt-0.5">{formatHijriDate(h)}</p>
            ) : null; })()}
          </motion.div>

          {/* Live clock card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card bg-gradient-to-br from-brand-emerald/15 to-brand-deep border border-brand-emerald/25 rounded-2xl"
          >
            <div className="card-body p-5 text-center">
              <div className="text-5xl sm:text-6xl font-black text-white tabular-nums tracking-tight">
                {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </div>

              {info && currentMeta && nextMeta && (
                <div className="mt-4 space-y-3">
                  {/* Row 1: Current prayer + Ends in — same line */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{currentMeta.icon}</span>
                      <div className="text-left">
                        <p className="text-white/40 text-xs uppercase tracking-widest leading-none mb-0.5">Current</p>
                        <p className="text-white font-bold text-base leading-none">{currentMeta.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40 text-xs uppercase tracking-widest leading-none mb-0.5">Ends in</p>
                      <p className="text-brand-gold font-black text-lg tabular-nums leading-none">
                        {info.hh > 0 ? `${info.hh}h ` : ''}
                        {String(info.mm).padStart(2, '0')}m{' '}
                        {String(info.ss).padStart(2, '0')}s
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-px bg-white/10" />

                  {/* Row 2: Next prayer */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{nextMeta.icon}</span>
                      <div className="text-left">
                        <p className="text-white/40 text-xs uppercase tracking-widest leading-none mb-0.5">Next</p>
                        <p className="text-brand-emerald/80 font-bold text-base leading-none">{nextMeta.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/30 text-xs leading-none mb-0.5">starts at</p>
                      <p className="text-white/60 font-semibold text-sm tabular-nums">{formatTime(info.nextTime)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Forbidden or nafl indicator */}
              {activeForbidden && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/15 border border-red-400/30 text-left"
                >
                  <span className="text-base shrink-0">🚫</span>
                  <div>
                    <p className="text-red-400 font-bold text-xs">{activeForbidden.label}</p>
                    <p className="text-red-300/60 text-xs">Ends at {formatTime(activeForbidden.end)}</p>
                  </div>
                </motion.div>
              )}
              {activeNafl && !activeForbidden && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-left"
                >
                  <span className="text-base shrink-0">{activeNafl.icon}</span>
                  <div>
                    <p className="text-cyan-300 font-bold text-xs">{activeNafl.label} time</p>
                    <p className="text-cyan-300/50 text-xs">Until {formatTime(activeNafl.end)}</p>
                  </div>
                </motion.div>
              )}

              {!location && (
                <p className="text-white/40 text-sm mt-4">
                  ↑ Set your location above to calculate prayer times
                </p>
              )}
            </div>
          </motion.div>

          {/* Interleaved timeline */}
          {location && times ? (
            <>
              <div className="space-y-2">
                {timeline.map((entry, i) => {
                  const key = `${entry.kind}-${i}`;
                  const isExpanded = expandedEntry === key;
                  const entryT = entryTime(entry);
                  const isPast = now.getTime() > (
                    entry.kind === 'prayer' || entry.kind === 'event'
                      ? entry.time.getTime()
                      : entry.end.getTime()
                  );
                  const isActiveNow =
                    (entry.kind === 'forbidden' || entry.kind === 'nafl')
                      ? now >= entry.start && now < entry.end
                      : entry.kind === 'prayer' && info?.current === entry.id;

                  // ── Prayer entry ───────────────────────────────────────
                  if (entry.kind === 'prayer') {
                    const isNext = info?.next === entry.id;
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * i }}
                        className={`card rounded-2xl border transition-all ${
                          isActiveNow
                            ? 'bg-brand-emerald/15 border-brand-emerald/50 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                            : isNext
                            ? 'bg-brand-emerald/5 border-brand-emerald/20'
                            : isPast
                            ? 'bg-brand-deep/50 border-brand-border/40 opacity-60'
                            : 'bg-brand-surface border-brand-border'
                        }`}
                      >
                        <div className="card-body p-4 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{entry.icon}</span>
                            <div>
                              <p className={`font-bold text-base ${
                                isActiveNow ? 'text-brand-emerald' : isNext ? 'text-brand-emerald/70' : 'text-white'
                              }`}>
                                {entry.name}
                              </p>
                              {isActiveNow && <span className="text-xs text-brand-emerald/60 font-semibold uppercase tracking-wide">● Current</span>}
                              {isNext && <span className="text-xs text-brand-emerald/40 font-semibold uppercase tracking-wide">Next</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-white/30 text-xs leading-none mb-0.5">starts at</p>
                            <p className={`text-xl font-black tabular-nums ${
                              isActiveNow ? 'text-brand-emerald' : isNext ? 'text-brand-emerald/60' : 'text-white/80'
                            }`}>
                              {formatTime(entry.time)}
                            </p>
                            {entry.endTime && entry.isTrackable && (
                              <p className="text-white/25 text-xs leading-none mt-0.5">→ {formatTime(entry.endTime)}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // ── Event entry (sunset) ───────────────────────────────
                  if (entry.kind === 'event') {
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * i }}
                        className={`rounded-xl border px-4 py-2.5 flex items-center justify-between ${
                          isPast
                            ? 'bg-brand-deep/30 border-brand-border/20 opacity-50'
                            : 'bg-brand-deep/60 border-brand-border/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{entry.icon}</span>
                          <div>
                            <p className="text-white/50 font-semibold text-sm">{entry.label}</p>
                            <p className="text-white/25 text-xs">{entry.note}</p>
                          </div>
                        </div>
                        <p className="text-white/40 text-base font-bold tabular-nums">{formatTime(entry.time)}</p>
                      </motion.div>
                    );
                  }

                  // ── Forbidden entry ────────────────────────────────────
                  if (entry.kind === 'forbidden') {
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * i }}
                        className={`rounded-2xl border overflow-hidden transition-all ${
                          isActiveNow
                            ? 'bg-red-500/15 border-red-400/50'
                            : isPast
                            ? 'bg-red-900/10 border-red-900/20 opacity-50'
                            : 'bg-red-900/15 border-red-800/30'
                        }`}
                      >
                        <button
                          className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
                          onClick={() => setExpandedEntry(isExpanded ? null : key)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-lg shrink-0">{isActiveNow ? '🔴' : '🚫'}</span>
                            <div className="min-w-0">
                              <p className={`font-bold text-sm ${isActiveNow ? 'text-red-400' : 'text-red-400/70'}`}>
                                {entry.label}
                                {isActiveNow && <span className="ml-2 text-xs font-normal text-red-400/60">● now</span>}
                              </p>
                              <p className="text-red-300/40 text-xs">{entry.note.slice(0, 60)}…</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-red-300/50 text-xs tabular-nums">{formatTime(entry.start)}</p>
                            <p className="text-red-300/30 text-xs">→ {formatTime(entry.end)}</p>
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="border-t border-red-400/20 px-4 py-3 space-y-2"
                            >
                              <p className={`text-sm ${isActiveNow ? 'text-red-300/80' : 'text-red-300/50'}`}>{entry.note}</p>
                              <p className="text-red-300/40 text-xs italic leading-relaxed">{entry.hadith}</p>
                              <a
                                href={entry.hadithUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-red-400/60 hover:text-red-300/80 underline"
                              >
                                📖 View on sunnah.com
                              </a>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }

                  // ── Nafl entry ────────────────────────────────────────
                  if (entry.kind === 'nafl') {
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * i }}
                        className={`rounded-2xl border overflow-hidden transition-all ${
                          isActiveNow
                            ? 'bg-cyan-500/10 border-cyan-400/40'
                            : isPast
                            ? 'bg-teal-900/10 border-teal-900/20 opacity-50'
                            : 'bg-teal-900/10 border-teal-800/25'
                        }`}
                      >
                        <button
                          className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
                          onClick={() => setExpandedEntry(isExpanded ? null : key)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-lg shrink-0">{entry.icon}</span>
                            <div className="min-w-0">
                              <p className={`font-bold text-sm ${isActiveNow ? 'text-cyan-300' : 'text-teal-300/70'}`}>
                                {entry.label}
                                {isActiveNow && <span className="ml-2 text-xs font-normal text-cyan-300/60">● now</span>}
                              </p>
                              <p className="text-teal-300/40 text-xs">{entry.arabicName}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-teal-300/50 text-xs tabular-nums">{formatTime(entry.start)}</p>
                            <p className="text-teal-300/30 text-xs">→ {formatTime(entry.end)}</p>
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="border-t border-teal-400/20 px-4 py-3 space-y-2"
                            >
                              <p className={`text-sm ${isActiveNow ? 'text-cyan-200/80' : 'text-teal-200/50'}`}>{entry.note}</p>
                              <p className="text-teal-300/40 text-xs italic leading-relaxed">{entry.hadith}</p>
                              <a
                                href={entry.hadithUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-teal-400/60 hover:text-teal-300/80 underline"
                              >
                                📖 View on sunnah.com
                              </a>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }

                  return null;
                })}
              </div>

              {/* Sources note */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card bg-brand-surface/60 border border-brand-border/60 rounded-2xl"
              >
                <div className="card-body p-4">
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1">
                    <InformationCircleIcon className="w-3.5 h-3.5" /> Sources
                  </p>
                  <div className="space-y-1.5 text-xs text-white/25 leading-relaxed">
                    <p>
                      <span className="text-white/40 font-semibold">Prayer times</span> — calculated locally using the{' '}
                      <span className="text-white/40">adhan</span> library with the <span className="text-white/40">Moonsighting Committee</span> method (suitable for worldwide use). No external API — all calculations use your GPS coordinates only.
                    </p>
                    <p>
                      <span className="text-white/40 font-semibold">Forbidden times</span> — Ṣaḥīḥ al-Bukhārī 581, 585, 586 ·{' '}
                      <a href="https://sunnah.com/bukhari:581" target="_blank" rel="noopener noreferrer" className="text-white/40 underline hover:text-white/60">sunnah.com/bukhari:581</a>
                      {' '}· Ṣaḥīḥ Muslim 831 ·{' '}
                      <a href="https://sunnah.com/muslim:831" target="_blank" rel="noopener noreferrer" className="text-white/40 underline hover:text-white/60">sunnah.com/muslim:831</a>
                    </p>
                    <p>
                      <span className="text-white/40 font-semibold">Ishraq/Duha</span> — Tirmidhī 586 ·{' '}
                      <a href="https://sunnah.com/tirmidhi:586" target="_blank" rel="noopener noreferrer" className="text-white/40 underline hover:text-white/60">sunnah.com/tirmidhi:586</a>
                      {' '}· Ṣaḥīḥ Muslim 717 ·{' '}
                      <a href="https://sunnah.com/muslim:717" target="_blank" rel="noopener noreferrer" className="text-white/40 underline hover:text-white/60">sunnah.com/muslim:717</a>
                    </p>
                    <p>
                      <span className="text-white/40 font-semibold">Awwabin</span> — Ibn Mājah 1167 ·{' '}
                      <a href="https://sunnah.com/ibnmajah:1167" target="_blank" rel="noopener noreferrer" className="text-white/40 underline hover:text-white/60">sunnah.com/ibnmajah:1167</a>
                    </p>
                    <p>
                      <span className="text-white/40 font-semibold">Tahajjud</span> — Ṣaḥīḥ al-Bukhārī 1145 ·{' '}
                      <a href="https://sunnah.com/bukhari:1145" target="_blank" rel="noopener noreferrer" className="text-white/40 underline hover:text-white/60">sunnah.com/bukhari:1145</a>
                      {' '}· Ṣaḥīḥ Muslim 758, 1163 ·{' '}
                      <a href="https://sunnah.com/muslim:758" target="_blank" rel="noopener noreferrer" className="text-white/40 underline hover:text-white/60">sunnah.com/muslim:758</a>
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          ) : null}

        </div>
      </div>
    </AnimatedBackground>
  );
}
