import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useZikrStore } from '../store/useZikrStore.js';
import { useAnalytics } from '../hooks/useAnalytics.js';
import { useSalatLog } from '../hooks/useSalatLog.js';
import AnimatedBackground from '../components/AnimatedBackground.js';
import {
  calcPrayerTimes,
  formatTime,
  getMandatoryWidget,
  PRAYER_META,
} from '../utils/prayerTimes.js';
import { getTodaySpecialDays } from '../utils/islamicCalendar.js';

interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  stats: { label: string; value: string | number };
  action: string;
  link: string;
  accentColor: string;
  iconBg: string;
  tag?: string;
  streakCount?: number | null;
  goalCompleted?: boolean;
}

export default function Home() {
  const { counts = {}, hydrate } = useZikrStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const doHydrate = () => hydrate?.();
    doHydrate();
    const onFocus = () => doHydrate();
    const onVisibility = () => { if (!document.hidden) doHydrate(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const { data: analyticsData } = useAnalytics(1);
  const { data: salatLog } = useSalatLog();

  const totalToday = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);
  const analyticsGoal = analyticsData?.goal?.dailyTarget ?? null;
  const streakCount = analyticsData?.streak?.currentStreak ?? null;
  const goalCompleted = totalToday !== null && analyticsGoal !== null ? totalToday >= analyticsGoal : false;

  // Salat completed count for today
  const salatCompletedToday = useMemo(() => {
    if (!salatLog) return null;
    return PRAYER_META.filter((p) => p.isTrackable).filter((p) => {
      const s = salatLog.prayers[p.id as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha']?.status;
      return s === 'completed' || s === 'kaza';
    }).length;
  }, [salatLog]);

  // Prayer times widget state
  const [prayerNow, setPrayerNow] = useState(new Date());
  const [locLoading, setLocLoading] = useState(false);
  // Widget shows hours+minutes only — 60s granularity is sufficient.
  useEffect(() => {
    const t = setInterval(() => setPrayerNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const enableLocation = useCallback(() => {
    if (!('geolocation' in navigator)) { navigate('/prayer-times'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let name = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const d = await r.json() as { address?: { city?: string; town?: string; village?: string; country?: string } };
          const city = d.address?.city ?? d.address?.town ?? d.address?.village;
          const country = d.address?.country;
          if (city || country) name = [city, country].filter(Boolean).join(', ');
        } catch { /* use coords fallback */ }
        localStorage.setItem('ihsan_location', JSON.stringify({ latitude, longitude, name }));
        setLocLoading(false);
        setPrayerNow(new Date()); // trigger recompute
      },
      () => { setLocLoading(false); navigate('/prayer-times'); },
      { timeout: 10000 }
    );
  }, [navigate]);

  const todaySpecialDays = useMemo(() => getTodaySpecialDays(), []);

  const prayerWidgetData = useMemo(() => {
    const stored = localStorage.getItem('ihsan_location');
    if (!stored) return null;
    try {
      const loc = JSON.parse(stored) as { latitude: number; longitude: number };
      const times  = calcPrayerTimes(loc.latitude, loc.longitude, prayerNow);
      const widget = getMandatoryWidget(times, prayerNow);

      // "Ends in" countdown for the currently active state
      const endTarget = widget.forbiddenWindow?.end ?? widget.currentMandatoryEnd ?? widget.naflWindow?.end;
      let endHh = 0, endMm = 0;
      if (endTarget) {
        const sec = Math.max(0, Math.floor((endTarget.getTime() - prayerNow.getTime()) / 1000));
        endHh = Math.floor(sec / 3600);
        endMm = Math.floor((sec % 3600) / 60);
      }
      return { ...widget, times, endHh, endMm };
    } catch { return null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prayerNow.getMinutes()]); // recalc every minute is enough for widget

  const activities: ActivityItem[] = [
    {
      id: 'zikr',
      icon: '📿',
      title: 'Zikr Counter',
      description: 'Continue your remembrance of Allah',
      stats: { label: 'Today', value: totalToday },
      action: 'Start Counting',
      link: '/zikr',
      accentColor: 'var(--brand-emerald, #10b981)',
      iconBg: 'bg-gradient-to-br from-brand-emerald/20 to-emerald-400/30',
      streakCount,
      goalCompleted,
    },
    {
      id: 'salat',
      icon: '🕌',
      title: 'Salat Tracker',
      description: 'Track your daily prayers',
      stats: { label: 'Today', value: salatCompletedToday !== null ? `${salatCompletedToday}/5` : '—/5' },
      action: 'Track Prayer',
      link: '/salat',
      accentColor: 'var(--brand-emerald, #10b981)',
      iconBg: 'bg-gradient-to-br from-indigo-500/20 to-purple-500/30',
    },
    {
      id: 'fasting',
      icon: '🌙',
      title: 'Fasting Tracker',
      description: 'Monitor your fasting journey',
      stats: { label: 'Streak', value: '0 days' },
      action: 'Log Fast',
      link: '/fasting',
      accentColor: 'var(--brand-magenta, #c026d3)',
      iconBg: 'bg-gradient-to-br from-brand-magenta/20 to-pink-500/30',
      tag: 'Coming Soon…',
    },
    {
      id: 'quran',
      icon: '📖',
      title: 'Quran Habit',
      description: 'Build a daily Quran reading habit',
      stats: { label: 'Status', value: 'Coming Soon' },
      action: 'Explore',
      link: '/quran',
      accentColor: 'var(--brand-magenta, #c026d3)',
      iconBg: 'bg-gradient-to-br from-brand-magenta/20 to-purple-500/30',
      tag: 'Coming Soon…',
    },
  ];

  return (
    <AnimatedBackground variant="premium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Prayer times widget / location CTA */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          {prayerWidgetData ? (
            <Link to="/prayer-times">
              <motion.div
                whileHover={{ scale: 1.005 }}
                className="flex items-stretch gap-0 rounded-2xl bg-brand-surface/80 backdrop-blur-md border border-brand-border hover:border-brand-emerald/30 transition-all overflow-hidden"
              >
                {/* LEFT: current status (forbidden / mandatory / nafl / free) */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0">
                  {/* Icon */}
                  <span className="text-2xl shrink-0 leading-none">
                    {prayerWidgetData.forbiddenWindow
                      ? '🚫'
                      : prayerWidgetData.currentMandatory
                      ? (PRAYER_META.find((p) => p.id === prayerWidgetData.currentMandatory)?.icon ?? '🕌')
                      : prayerWidgetData.naflWindow
                      ? prayerWidgetData.naflWindow.icon
                      : '🕊️'}
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {prayerWidgetData.forbiddenWindow ? (
                      <>
                        <p className="text-red-400/60 text-[10px] uppercase tracking-widest leading-none mb-0.5">Forbidden Time</p>
                        <p className="text-red-300 font-black text-sm leading-tight">
                          {prayerWidgetData.forbiddenWindow.label.replace('Forbidden — ', '')}
                        </p>
                        <p className="text-white/35 text-[10px] mt-0.5">
                          ends {formatTime(prayerWidgetData.forbiddenWindow.end)} — no prayer
                        </p>
                      </>
                    ) : prayerWidgetData.currentMandatory ? (
                      <>
                        <p className="text-white/35 text-[10px] uppercase tracking-widest leading-none mb-0.5">Current</p>
                        <p className="text-white font-black text-sm leading-tight">
                          {PRAYER_META.find((p) => p.id === prayerWidgetData.currentMandatory)?.name}
                        </p>
                        <p className="text-white/35 text-[10px] mt-0.5">
                          ends {formatTime(prayerWidgetData.currentMandatoryEnd!)}
                        </p>
                        {/* Nafl alongside mandatory (Awabeen during Maghrib, Tahajjud during Isha) */}
                        {prayerWidgetData.naflWindow && (
                          <div className="mt-1 pt-1 border-t border-brand-border/40">
                            <p className="text-brand-magenta/80 text-[10px] font-semibold leading-none">
                              {prayerWidgetData.naflWindow.icon} {prayerWidgetData.naflWindow.name} time
                            </p>
                            <p className="text-white/25 text-[10px] leading-none mt-0.5">
                              until {formatTime(prayerWidgetData.naflWindow.end)}
                            </p>
                          </div>
                        )}
                      </>
                    ) : prayerWidgetData.naflWindow ? (
                      <>
                        <p className="text-cyan-400/60 text-[10px] uppercase tracking-widest leading-none mb-0.5">Nafl Time</p>
                        <p className="text-cyan-300 font-black text-sm leading-tight">{prayerWidgetData.naflWindow.name}</p>
                        <p className="text-white/35 text-[10px] mt-0.5">
                          {formatTime(prayerWidgetData.naflWindow.start)} – {formatTime(prayerWidgetData.naflWindow.end)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-white/25 text-[10px] uppercase tracking-widest leading-none mb-0.5">Free Time</p>
                        <p className="text-white/50 font-semibold text-sm leading-tight">Next prayer coming up</p>
                        <p className="text-white/25 text-[10px] mt-0.5">
                          in {prayerWidgetData.nextHh > 0 ? `${prayerWidgetData.nextHh}h ` : ''}
                          {String(prayerWidgetData.nextMm).padStart(2, '0')}m
                        </p>
                      </>
                    )}
                  </div>

                  {/* Ends-in counter (right side of left section) */}
                  {(prayerWidgetData.endHh > 0 || prayerWidgetData.endMm > 0) && (
                    <div className="text-right shrink-0">
                      <p className="text-white/35 text-[10px] uppercase tracking-widest leading-none mb-0.5">Ends in</p>
                      <p className={`font-black text-base tabular-nums leading-tight ${
                        prayerWidgetData.forbiddenWindow ? 'text-red-400' : 'text-brand-gold'
                      }`}>
                        {prayerWidgetData.endHh > 0 ? `${prayerWidgetData.endHh}h ` : ''}
                        {String(prayerWidgetData.endMm).padStart(2, '0')}m
                      </p>
                    </div>
                  )}
                </div>

                {/* DIVIDER */}
                <div className="w-px bg-brand-border/60 self-stretch my-2" />

                {/* RIGHT: next mandatory prayer */}
                <div className="flex flex-col justify-center px-4 py-3 shrink-0 min-w-[110px] sm:min-w-[130px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">
                      {PRAYER_META.find((p) => p.id === prayerWidgetData.nextMandatory)?.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white/35 text-[10px] uppercase tracking-widest leading-none mb-0.5">Next</p>
                      <p className="text-brand-emerald font-bold text-xs leading-tight">
                        {PRAYER_META.find((p) => p.id === prayerWidgetData.nextMandatory)?.name}
                      </p>
                      <p className="text-white/30 text-[10px] leading-none">{formatTime(prayerWidgetData.nextMandatoryTime)}</p>
                    </div>
                  </div>
                  <p className="text-white/20 text-[10px] mt-1">
                    in {prayerWidgetData.nextHh > 0 ? `${prayerWidgetData.nextHh}h ` : ''}
                    {String(prayerWidgetData.nextMm).padStart(2, '0')}m
                  </p>
                </div>
              </motion.div>
            </Link>
          ) : (
            /* No location stored — prompt to enable */
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={enableLocation}
              disabled={locLoading}
              className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-brand-surface/60 backdrop-blur-md border border-brand-border/60 border-dashed hover:border-brand-emerald/40 hover:bg-brand-surface/80 transition-all text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                {locLoading
                  ? <span className="loading loading-spinner loading-xs text-brand-emerald shrink-0" />
                  : <MapPinIcon className="w-5 h-5 text-brand-emerald/60 shrink-0" />
                }
                <div className="min-w-0">
                  <p className="text-white/70 font-semibold text-sm leading-none mb-0.5">Enable Prayer Times</p>
                  <p className="text-white/30 text-xs">Tap to share your location and see live prayer times here</p>
                </div>
              </div>
              <span className="text-brand-emerald/50 text-xs font-semibold shrink-0">
                {locLoading ? 'Locating…' : 'Set Location →'}
              </span>
            </motion.button>
          )}
        </motion.div>

        {/* Islamic special day widget */}
        {todaySpecialDays.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 space-y-2"
          >
            {todaySpecialDays.map((day) => (
              <Link key={day.id} to={`/special-day/${day.id}`}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border overflow-hidden transition-all"
                  style={{ background: `${day.color}12`, borderColor: `${day.color}40` }}
                >
                  <span className="text-2xl shrink-0">{day.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm leading-tight">{day.name}</p>
                    <p className="text-white/45 text-xs leading-snug truncate mt-0.5">{day.shortDesc}</p>
                  </div>
                  <span className="text-white/30 text-xs shrink-0 font-bold">→</span>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {activities.map((a, i) => {
            const isZikr = a.id === 'zikr';
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link to={a.link} className="block h-full group">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative h-full rounded-3xl overflow-hidden backdrop-blur-2xl border border-white/10 bg-white/5"
                  >
                    {a.tag && (
                      <span
                        className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md border border-white/10"
                        style={{
                          letterSpacing: '0.04em',
                          background: 'linear-gradient(90deg, var(--brand-gold) 0%, var(--brand-magenta) 100%)',
                        }}
                      >
                        {a.tag}
                      </span>
                    )}

                    {isZikr && (
                      <div className="absolute top-4 right-4 z-20 flex flex-row items-center gap-2">
                        <div className="tooltip tooltip-left" data-tip={`Streak: ${a.streakCount ?? '-'} day${a.streakCount === 1 ? '' : 's'}`}>
                          <div className="px-2 py-1 rounded-full flex items-center gap-1 font-bold shadow-lg border border-white/10 backdrop-blur-md bg-gradient-to-br from-brand-emerald/60 via-pink-400/30 to-brand-gold/40">
                            <span className="text-base" role="img" aria-label="streak">🔥</span>
                            <span className="text-xs text-white/90 font-bold">
                              {a.streakCount !== null ? a.streakCount : <span className="loading loading-spinner loading-xs" />}
                            </span>
                          </div>
                        </div>
                        <div
                          className="tooltip tooltip-left"
                          data-tip={a.goalCompleted ? '🏆 Daily goal achieved!' : `🎯 Goal: ${analyticsGoal ?? '…'} zikr/day`}
                        >
                          <div className={`px-2 py-1 rounded-full flex items-center font-bold shadow-lg border border-white/10 backdrop-blur-md bg-gradient-to-br from-brand-gold/60 via-pink-400/30 to-brand-emerald/40 ${a.goalCompleted ? '' : 'opacity-70'}`}>
                            <span className="text-base" role="img" aria-label="goal">
                              {a.goalCompleted ? '✅' : '🎯'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="relative z-10 p-6 sm:p-8">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 ${a.iconBg} rounded-2xl grid place-items-center border border-white/10 mb-5`}>
                        <span className="text-4xl sm:text-5xl">{a.icon}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{a.title}</h2>
                      <p className="text-white/70 text-sm sm:text-base mb-6">{a.description}</p>
                      <div
                        className="rounded-2xl p-4 text-center text-white"
                        style={{ background: `linear-gradient(135deg, ${a.accentColor}90, ${a.accentColor}70)` }}
                      >
                        <div className="text-3xl sm:text-4xl font-black">{a.stats.value}</div>
                        <div className="text-xs sm:text-sm opacity-90 font-semibold mt-1 uppercase">{a.stats.label}</div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-5 w-full py-3 rounded-xl text-white font-bold relative overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${a.accentColor}, ${a.accentColor}cc)` }}
                      >
                        <span className="relative z-10">{a.action}</span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.6 }}
                        />
                      </motion.button>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center text-xs text-white/50">May your remembrance be constant.</div>
      </div>
    </AnimatedBackground>
  );
}
