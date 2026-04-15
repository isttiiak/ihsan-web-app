import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { ArrowLeftIcon, MapPinIcon } from '@heroicons/react/24/outline';
import {
  calcPrayerTimes,
  formatTime,
  getCurrentAndNextPrayer,
  getForbiddenWindows,
  PRAYER_META,
  PrayerTimesResult,
  ForbiddenWindow,
} from '../utils/prayerTimes.js';

interface StoredLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

export default function PrayerTimes() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [location, setLocation] = useState<StoredLocation | null>(() => {
    const s = localStorage.getItem('ihsan_location');
    return s ? (JSON.parse(s) as StoredLocation) : null;
  });
  const [times, setTimes] = useState<PrayerTimesResult | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');

  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Recalculate prayer times when location or date changes
  useEffect(() => {
    if (!location) return;
    setTimes(calcPrayerTimes(location.latitude, location.longitude, now));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, now.toDateString()]);

  const requestLocation = useCallback(() => {
    setLocLoading(true);
    setLocError('');
    if (!('geolocation' in navigator)) {
      setLocError('Geolocation is not supported by your browser.');
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
        const loc: StoredLocation = { latitude, longitude, name };
        setLocation(loc);
        localStorage.setItem('ihsan_location', JSON.stringify(loc));
        setLocLoading(false);
      },
      (err) => {
        setLocError(`Could not get location: ${err.message}`);
        setLocLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  const info = times ? getCurrentAndNextPrayer(times, now) : null;
  const nextMeta = PRAYER_META.find((p) => p.id === info?.next);
  const currentMeta = PRAYER_META.find((p) => p.id === info?.current);
  const forbiddenWindows: ForbiddenWindow[] = times ? getForbiddenWindows(times) : [];

  // Is current time in a forbidden window?
  const activeForbidden = forbiddenWindows.find((w) => now >= w.start && now < w.end);

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Top row: Back button + Location button */}
          <div className="flex items-center justify-between gap-3">
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-surface/90 backdrop-blur-md border border-brand-border text-white text-sm font-semibold shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <ArrowLeftIcon className="w-4 h-4" /> Back
            </motion.button>

            {/* Location — top-right */}
            <div className="flex items-center gap-2">
              {location && (
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <MapPinIcon className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-[180px]">{location.name}</span>
                </div>
              )}
              {locError && <p className="text-red-400 text-xs">{locError}</p>}
              <button
                onClick={requestLocation}
                disabled={locLoading}
                className="btn btn-xs bg-brand-emerald/20 hover:bg-brand-emerald/30 text-brand-emerald border border-brand-emerald/40 shrink-0"
              >
                {locLoading
                  ? <span className="loading loading-spinner loading-xs" />
                  : <><MapPinIcon className="w-3 h-3" /> {location ? 'Update' : 'Set Location'}</>
                }
              </button>
            </div>
          </div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-brand-emerald mb-1">Prayer Times</h1>
            <p className="text-white/50 text-sm">
              {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          {/* Live clock + next prayer card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card bg-gradient-to-br from-brand-emerald/15 to-brand-deep border border-brand-emerald/25 rounded-2xl"
          >
            <div className="card-body p-6 text-center">
              <div className="text-5xl sm:text-6xl font-black text-white tabular-nums tracking-tight">
                {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </div>

              {info && nextMeta && times && (
                <div className="mt-4 flex flex-col items-center gap-1">
                  {currentMeta && (
                    <div className="text-brand-emerald/70 text-xs font-semibold uppercase tracking-widest mb-1">
                      {currentMeta.icon} {currentMeta.name} time
                    </div>
                  )}
                  <span className="text-white/40 text-xs uppercase tracking-widest">Next</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl">{nextMeta.icon}</span>
                    <span className="text-xl font-bold text-white">{nextMeta.name}</span>
                    <span className="text-white/50 text-sm">{formatTime(info.nextTime)}</span>
                  </div>
                  <div className="text-brand-gold font-black text-2xl tabular-nums mt-1">
                    {String(info.hh).padStart(2, '0')}h {String(info.mm).padStart(2, '0')}m {String(info.ss).padStart(2, '0')}s
                  </div>
                </div>
              )}

              {/* Forbidden time warning */}
              {activeForbidden && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-400/30 text-left"
                >
                  <span className="text-lg shrink-0">🚫</span>
                  <div>
                    <p className="text-red-400 font-bold text-sm">{activeForbidden.label}</p>
                    <p className="text-red-300/70 text-xs mt-0.5">{activeForbidden.note}</p>
                    <p className="text-red-300/50 text-xs mt-0.5">
                      Ends at {formatTime(activeForbidden.end)}
                    </p>
                  </div>
                </motion.div>
              )}

              {!location && (
                <p className="text-white/40 text-sm mt-3">Set your location above to see prayer times</p>
              )}
            </div>
          </motion.div>

          {/* Prayer times list */}
          {location && times ? (
            <>
              <div className="space-y-2">
                {PRAYER_META.map((prayer, i) => {
                  const pTime = times[prayer.id];
                  const isCurrent = info?.current === prayer.id;
                  const isNext = info?.next === prayer.id;

                  return (
                    <motion.div
                      key={prayer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className={`card rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-brand-emerald/15 border-brand-emerald/50 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                          : isNext
                          ? 'bg-brand-emerald/5 border-brand-emerald/20'
                          : 'bg-brand-surface border-brand-border'
                      }`}
                    >
                      <div className="card-body p-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{prayer.icon}</span>
                          <div>
                            <p className={`font-bold text-base ${
                              isCurrent ? 'text-brand-emerald' : isNext ? 'text-brand-emerald/70' : 'text-white'
                            }`}>
                              {prayer.name}
                            </p>
                            {isCurrent && (
                              <span className="text-xs text-brand-emerald/70 font-semibold uppercase tracking-wide">● Current</span>
                            )}
                            {isNext && (
                              <span className="text-xs text-brand-emerald/50 font-semibold uppercase tracking-wide">Next</span>
                            )}
                          </div>
                        </div>
                        <p className={`text-xl font-black tabular-nums ${
                          isCurrent ? 'text-brand-emerald' : isNext ? 'text-brand-emerald/60' : 'text-white/80'
                        }`}>
                          {formatTime(pTime)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Sunset row */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="card rounded-2xl border bg-brand-surface/60 border-brand-border/60"
                >
                  <div className="card-body p-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">🌇</span>
                      <div>
                        <p className="font-bold text-base text-white/60">Sunset</p>
                        <p className="text-white/30 text-xs">Sun sets below horizon</p>
                      </div>
                    </div>
                    <p className="text-xl font-black tabular-nums text-white/50">
                      {formatTime(times.sunset)}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Forbidden prayer times */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card bg-brand-surface border border-brand-border rounded-2xl"
              >
                <div className="card-body p-4">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">
                    🚫 Forbidden Prayer Times
                  </p>
                  <div className="space-y-3">
                    {forbiddenWindows.map((w, i) => {
                      const isActive = now >= w.start && now < w.end;
                      return (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-red-500/15 border-red-400/40'
                            : 'bg-brand-deep border-brand-border/50'
                        }`}>
                          <span className="text-base shrink-0 mt-0.5">{isActive ? '🔴' : '⛔'}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${isActive ? 'text-red-400' : 'text-white/70'}`}>
                              {w.label}
                              {isActive && <span className="ml-2 text-xs font-normal text-red-400/70">● now</span>}
                            </p>
                            <p className="text-white/30 text-xs mt-0.5">{w.note}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-white/50 text-xs tabular-nums">{formatTime(w.start)}</p>
                            <p className="text-white/30 text-xs">→ {formatTime(w.end)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Source note */}
              <p className="text-center text-white/20 text-xs pb-2">
                Times calculated locally using the{' '}
                <span className="text-white/40">Moonsighting Committee</span> method (adhan library) · GPS coordinates from your device
              </p>
            </>
          ) : !location ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card bg-brand-surface border border-brand-border rounded-2xl"
            >
              <div className="card-body text-center p-10">
                <div className="text-4xl mb-3">📍</div>
                <p className="text-white/60">Set your location above to see accurate prayer times calculated for your area worldwide.</p>
              </div>
            </motion.div>
          ) : null}

        </div>
      </div>
    </AnimatedBackground>
  );
}
