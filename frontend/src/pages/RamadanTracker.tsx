import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import ExcusedCard from '../components/ExcusedCard.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useFastingHistory, useUpsertFastingLog, useClearFastingLog } from '../hooks/useFasting.js';
import { useCycleSummary } from '../hooks/useCycle.js';
import { getRamadanWindow } from '../utils/ramadan.js';
import { getTrackingDay } from '../utils/trackingDay.js';
import { calcPrayerTimes, formatTime } from '../utils/prayerTimes.js';
import { celebrateFast } from '../utils/celebrate.js';

/**
 * Dedicated Ramadan tracker (v3.1) — the month gets its own home:
 *  · countdown + preparation before the month
 *  · 30-day grid, suhoor/iftar times, tarawih nights, Laylat al-Qadr focus
 *  · fully wired with FastingLog (category 'ramadan') and Rayhanah Cycle
 *    (excused days show 🌸 and flow into qada automatically on cycle end)
 */

function formatGregorian(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function RamadanTracker() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const today = getTrackingDay();
  const window_ = useMemo(() => getRamadanWindow(), []);

  const { data: history } = useFastingHistory(90, true);
  const { data: cycleSummary } = useCycleSummary();
  const upsert = useUpsertFastingLog();
  const clearLog = useClearFastingLog();
  const [confirmUnlog, setConfirmUnlog] = useState(false);

  const logsByDate = useMemo(() => {
    const m = new Map<string, { status: string; tarawih?: boolean }>();
    for (const l of (history ?? [])) {
      if (l.category === 'ramadan') m.set(l.date, { status: l.status, tarawih: (l as { tarawih?: boolean }).tarawih });
    }
    return m;
  }, [history]);

  // Rayhanah excused intervals (female users) — 🌸 days on the grid
  const isExcused = (day: string): boolean => {
    for (const l of (cycleSummary?.logs ?? [])) {
      const end = l.endDate ?? (cycleSummary?.active ? today : l.startDate);
      if (l.startDate <= day && day <= end) return true;
    }
    return false;
  };
  const excusedToday = isExcused(today);

  const todayLog = logsByDate.get(today);
  const fastedCount = window_.days.filter((d) => logsByDate.get(d.date)?.status === 'completed').length;
  const tarawihCount = window_.days.filter((d) => logsByDate.get(d.date)?.tarawih).length;
  const excusedCount = window_.days.filter((d) => d.date <= today && isExcused(d.date)).length;

  // Suhoor/iftar from the saved location
  const prayerTimes = useMemo(() => {
    try {
      const raw = localStorage.getItem('ihsan_location');
      if (!raw) return null;
      const loc = JSON.parse(raw) as { latitude: number; longitude: number };
      return calcPrayerTimes(loc.latitude, loc.longitude, new Date());
    } catch { return null; }
  }, []);

  const logToday = (status: 'completed' | 'intended') => {
    upsert.mutate(
      { date: today, category: 'ramadan', status, tarawih: todayLog?.tarawih ?? false },
      { onSuccess: () => { if (status === 'completed') celebrateFast(); } }
    );
  };
  const toggleTarawih = () => {
    upsert.mutate({
      date: today,
      category: 'ramadan',
      status: (todayLog?.status as 'completed' | 'intended' | 'broken') ?? 'intended',
      tarawih: !todayLog?.tarawih,
    });
  };

  if (!user) return null;

  // ────────────────────────── COUNTDOWN MODE ──────────────────────────
  if (!window_.active) {
    const startStr = window_.days[0]?.date;
    return (
      <AnimatedBackground variant="dark">
        <h1 className="sr-only">Ramadan Tracker</h1>
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-16 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-8 border border-brand-gold/25 bg-gradient-to-br from-brand-gold/15 via-amber-500/10 to-purple-500/10 text-center relative overflow-hidden"
          >
            <motion.div
              className="absolute -top-14 -right-14 w-48 h-48 rounded-full bg-brand-gold/15 blur-2xl"
              animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative">
              <div className="text-6xl mb-3">🌙</div>
              <p className="text-brand-gold/80 text-xs font-bold uppercase tracking-widest">
                Ramadan {window_.hijriYear ?? ''} AH
              </p>
              <h2 className="text-5xl font-black text-white mt-2">{window_.daysUntil}</h2>
              <p className="text-white/50 text-sm font-semibold">days away, in shāʾ Allāh</p>
              {startStr && (
                <p className="text-white/30 text-xs mt-2">expected around {formatGregorian(startStr)} (moon sighting decides)</p>
              )}
              <p className="text-amber-100/80 text-sm mt-4 leading-relaxed max-w-md mx-auto">
                "When Ramadan begins, the gates of Paradise are opened, the gates of Hellfire are closed,
                and the devils are chained." —{' '}
                <a className="underline" href="https://sunnah.com/bukhari:1899" target="_blank" rel="noreferrer">Ṣaḥīḥ al-Bukhārī 1899</a>
              </p>
            </div>
          </motion.div>

          <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5 space-y-3">
            <h2 className="text-white font-black">🧭 Prepare your heart</h2>
            <div className="space-y-2 text-sm">
              <Link to="/fasting" className="flex items-center gap-3 rounded-xl px-3 py-3 bg-white/3 hover:bg-white/6 transition-colors">
                <span className="text-lg">🧾</span>
                <span className="flex-1 text-white/75">Clear your qaḍā days before Ramadan arrives</span>
                <span className="text-brand-gold/70 text-xs">Open →</span>
              </Link>
              <Link to="/fasting" className="flex items-center gap-3 rounded-xl px-3 py-3 bg-white/3 hover:bg-white/6 transition-colors">
                <span className="text-lg">🌗</span>
                <span className="flex-1 text-white/75">
                  Warm up in Shaʿbān — the Prophet ﷺ fasted in it more than any month besides Ramadan
                  {' '}(<a className="underline" href="https://sunnah.com/bukhari:1969" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Bukhārī 1969</a>)
                </span>
                <span className="text-brand-gold/70 text-xs">Open →</span>
              </Link>
              <Link to="/quran" className="flex items-center gap-3 rounded-xl px-3 py-3 bg-white/3 hover:bg-white/6 transition-colors">
                <span className="text-lg">📖</span>
                <span className="flex-1 text-white/75">Build your Quran habit now so the month of the Quran finds you ready</span>
                <span className="text-brand-gold/70 text-xs">Open →</span>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
            <h2 className="text-white font-black mb-2">✨ Why this month is everything</h2>
            <ul className="space-y-2 text-xs text-white/55 leading-relaxed">
              <li>
                • "Whoever fasts Ramadan out of faith and seeking reward, his previous sins are forgiven." —{' '}
                <a className="underline" href="https://sunnah.com/bukhari:38" target="_blank" rel="noreferrer">Bukhārī 38</a>
              </li>
              <li>
                • "The Night of Decree is better than a thousand months." —{' '}
                <a className="underline" href="https://quran.com/97/3" target="_blank" rel="noreferrer">Quran 97:3</a>
              </li>
              <li>
                • "Whoever stands (in prayer) during Laylat al-Qadr out of faith and seeking reward, his previous
                sins are forgiven." —{' '}
                <a className="underline" href="https://sunnah.com/bukhari:1901" target="_blank" rel="noreferrer">Bukhārī 1901</a>
              </li>
            </ul>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  // ────────────────────────── LIVE MODE ──────────────────────────
  const dayNo = window_.todayNumber ?? 1;
  const inLastTen = dayNo >= 21;

  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Ramadan Tracker</h1>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-16 space-y-5">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 sm:p-8 border border-brand-gold/25 bg-gradient-to-br from-brand-gold/15 via-amber-500/10 to-indigo-500/10 relative overflow-hidden"
        >
          <div className="relative">
            <p className="text-brand-gold/80 text-xs font-bold uppercase tracking-widest">🌙 Ramadan {window_.hijriYear} AH</p>
            <h2 className="text-3xl font-black text-white mt-1">Day {dayNo} <span className="text-white/35 text-lg">of {window_.days.length}</span></h2>

            {/* progress */}
            <div className="mt-3 h-2.5 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-gold to-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((fastedCount / window_.days.length) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-white/40 text-xs mt-1.5">{fastedCount} fasted · {tarawihCount} tarawih nights{excusedCount > 0 ? ` · ${excusedCount} 🌸 excused (auto-qaḍā)` : ''}</p>

            {/* suhoor / iftar */}
            {prayerTimes ? (
              <div className="flex gap-3 mt-4">
                <div className="flex-1 rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                  <p className="text-white/35 text-[10px] font-bold uppercase">Suhoor ends (Fajr)</p>
                  <p className="text-white font-black text-lg">{formatTime(prayerTimes.fajr)}</p>
                  <p className="text-white/25 text-[10px]">"Take suhoor — there is blessing in it" · <a className="underline" href="https://sunnah.com/bukhari:1923" target="_blank" rel="noreferrer">Bukhārī 1923</a></p>
                </div>
                <div className="flex-1 rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                  <p className="text-white/35 text-[10px] font-bold uppercase">Iftar (Maghrib)</p>
                  <p className="text-white font-black text-lg">{formatTime(prayerTimes.maghrib)}</p>
                  <p className="text-white/25 text-[10px]">"People remain upon good while they hasten iftar" · <a className="underline" href="https://sunnah.com/bukhari:1957" target="_blank" rel="noreferrer">Bukhārī 1957</a></p>
                </div>
              </div>
            ) : (
              <button className="mt-4 text-xs text-brand-gold/70 underline" onClick={() => navigate('/prayer-times')}>
                Set your location to see suhoor & iftar times →
              </button>
            )}

            {/* today's action */}
            {excusedToday ? (
              <div className="mt-4"><ExcusedCard feature="fasting" /></div>
            ) : todayLog?.status === 'completed' ? (
              <div className="mt-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 p-4 text-center">
                <p className="text-emerald-200 font-black">✅ Day {dayNo} fasted — taqabbal Allāh! </p>
                {confirmUnlog ? (
                  <p className="text-xs mt-1">
                    <button className="text-red-300 underline" onClick={() => { clearLog.mutate(today); setConfirmUnlog(false); }}>Yes, remove it</button>
                    <button className="text-white/40 ml-3" onClick={() => setConfirmUnlog(false)}>Keep</button>
                  </p>
                ) : (
                  <button className="text-white/25 text-[10px] underline mt-1" onClick={() => setConfirmUnlog(true)}>logged by mistake?</button>
                )}
              </div>
            ) : (
              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 btn h-12 rounded-2xl border-0 text-white font-black bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-400 hover:to-amber-500"
                  disabled={upsert.isPending}
                  onClick={() => logToday('completed')}
                >✅ I fasted today</button>
                {todayLog?.status !== 'intended' && (
                  <button
                    className="btn h-12 rounded-2xl bg-white/5 border-white/15 text-white/70 font-bold"
                    disabled={upsert.isPending}
                    onClick={() => logToday('intended')}
                  >🌅 Intending</button>
                )}
              </div>
            )}

            {/* tarawih toggle — salat, so hidden on excused days */}
            {!excusedToday && (
              <button
                className={`mt-3 w-full btn btn-sm rounded-xl border ${todayLog?.tarawih ? 'bg-indigo-500/25 border-indigo-400/40 text-indigo-100' : 'bg-white/5 border-white/10 text-white/50'}`}
                disabled={upsert.isPending}
                onClick={toggleTarawih}
              >
                {todayLog?.tarawih ? '🕌 Tarawih prayed tonight ✓' : '🕌 Mark tonight\'s tarawih'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Laylat al-Qadr focus */}
        {inLastTen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 border border-purple-400/30 bg-gradient-to-br from-purple-500/15 to-indigo-500/10"
          >
            <h2 className="text-white font-black">✨ The last ten nights</h2>
            <p className="text-purple-100/70 text-xs mt-1 leading-relaxed">
              Seek Laylat al-Qadr in the odd nights — it is better than a thousand months
              (<a className="underline" href="https://quran.com/97/3" target="_blank" rel="noreferrer">Quran 97:3</a>,{' '}
              <a className="underline" href="https://sunnah.com/bukhari:2017" target="_blank" rel="noreferrer">Bukhārī 2017</a>).
              Duʿā of the night: <span className="italic">Allāhumma innaka ʿafuwwun tuḥibbul-ʿafwa faʿfu ʿannī</span>{' '}
              (<a className="underline" href="https://sunnah.com/tirmidhi:3513" target="_blank" rel="noreferrer">Tirmidhī 3513</a>).
            </p>
            <div className="flex gap-1.5 mt-3">
              {[21, 23, 25, 27, 29].map((n) => (
                <span key={n} className={`flex-1 text-center py-2 rounded-xl text-sm font-black ${n === dayNo ? 'bg-purple-500/40 text-white ring-2 ring-purple-300/60' : n < dayNo ? 'bg-white/5 text-white/30' : 'bg-purple-500/15 text-purple-200'}`}>
                  {n}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* 30-day grid */}
        <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
          <h2 className="text-white font-black mb-3">📅 Your month</h2>
          <div className="grid grid-cols-6 gap-1.5">
            {window_.days.map((d) => {
              const log = logsByDate.get(d.date);
              const excused = isExcused(d.date);
              const isPast = d.date < today;
              const isToday = d.date === today;
              let face = String(d.dayNumber);
              let cls = 'bg-white/[0.04] text-white/35';
              if (excused && d.date <= today) { face = '🌸'; cls = 'bg-pink-500/20 text-pink-100'; }
              else if (log?.status === 'completed') { face = '✓'; cls = 'bg-emerald-500/30 text-emerald-100'; }
              else if (log?.status === 'intended') { face = '🌅'; cls = 'bg-cyan-500/20 text-cyan-100'; }
              else if (log?.status === 'broken') { face = '💔'; cls = 'bg-red-500/20 text-red-200'; }
              else if (isPast) { cls = 'bg-white/[0.03] text-white/20'; }
              return (
                <div
                  key={d.date}
                  title={`Day ${d.dayNumber} — ${formatGregorian(d.date)}${d.isLastTen && d.isOdd ? ' · odd night ⭐' : ''}`}
                  className={[
                    'relative aspect-square rounded-xl grid place-items-center text-xs font-black transition-all',
                    cls,
                    isToday ? 'ring-2 ring-brand-gold/80' : '',
                    d.isLastTen && d.isOdd ? 'border border-purple-400/40' : '',
                  ].join(' ')}
                >
                  {face}
                  {log?.tarawih && <span className="absolute top-0.5 right-1 text-[8px]">🕌</span>}
                  <span className="absolute bottom-0.5 left-1 text-[7px] text-white/25">{d.dayNumber}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-white/35">
            <span>✓ fasted</span><span>🌅 intending</span><span>💔 broken</span><span>🌸 excused → qaḍā</span>
            <span>🕌 tarawih</span><span className="text-purple-300/60">bordered = odd night of last ten</span>
          </div>
          <p className="text-white/25 text-[10px] mt-2 leading-relaxed">
            🌸 Rayhanah days are excused with zero guilt — when the cycle ends, those Ramadan days are offered
            to your qaḍā counter automatically (<a className="underline" href="https://sunnah.com/muslim:335" target="_blank" rel="noreferrer">Muslim 335</a>).
          </p>
        </div>
      </div>
    </AnimatedBackground>
  );
}
