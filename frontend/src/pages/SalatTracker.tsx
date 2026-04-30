import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { ChevronLeftIcon, ChevronRightIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import {
  useSalatLog,
  useUpdatePrayer,
  useUpdateNafl,
  PrayerId,
  PrayerStatus,
  PrayerLocation,
  NaflType,
  NAFL_TYPE_META,
} from '../hooks/useSalatLog.js';
import {
  PRAYER_META,
  calcPrayerTimes,
  getCurrentAndNextPrayer,
  formatTime,
} from '../utils/prayerTimes.js';
import { isFriday, getHijriDate, formatHijriDate } from '../utils/islamicCalendar.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function computeMinRakat(types: NaflType[]): number {
  if (types.length === 0) return 2;
  return types.reduce((sum, id) => {
    const meta = NAFL_TYPE_META.find((m) => m.id === id);
    return sum + (meta?.defaultRakat ?? 2);
  }, 0);
}

function isRamadanNow(): boolean {
  try {
    const month = parseInt(
      new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { month: 'numeric' }).format(new Date()),
      10
    );
    return month === 9;
  } catch { return false; }
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function offsetDate(base: string, delta: number): string {
  const d = new Date(base + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function isFuturePrayer(prayerId: string, todayTimes: Record<string, Date> | null | undefined): boolean {
  if (!todayTimes) return false;
  const t = todayTimes[prayerId];
  return !!t && t > new Date();
}
function isCurrentPrayer(prayerId: string, currentId: string | undefined): boolean {
  return prayerId === currentId;
}
function friendlyDate(dateStr: string): string {
  const today = todayStr();
  const yesterday = offsetDate(today, -1);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── types ───────────────────────────────────────────────────────────────────

interface SubTagDef {
  value: PrayerLocation;
  label: string;
  emoji: string;
  note: string;
}

const LOCATION_TAGS: SubTagDef[] = [
  { value: 'mosque', label: 'At Mosque', emoji: '🕌', note: 'in jamat' },
  { value: 'jamat',  label: 'In Jamat',  emoji: '👥', note: 'not at mosque' },
  { value: 'home',   label: 'At Home',   emoji: '🏠', note: 'alone' },
];

// Primary colour per status
const STATUS_STYLE: Record<PrayerStatus, { bg: string; border: string; text: string; emoji: string }> = {
  completed: { bg: 'bg-brand-emerald/20', border: 'border-brand-emerald/60', text: 'text-brand-emerald', emoji: '✅' },
  kaza:      { bg: 'bg-brand-gold/20',    border: 'border-brand-gold/60',    text: 'text-brand-gold',    emoji: '⏰' },
  missed:    { bg: 'bg-red-500/20',        border: 'border-red-400/60',        text: 'text-red-400',       emoji: '❌' },
  pending:   { bg: 'bg-brand-surface',    border: 'border-brand-border',     text: 'text-white/40',      emoji: '⬜' },
};

// ─── component ───────────────────────────────────────────────────────────────

function getDefaultDate(): string {
  const today = todayStr();
  try {
    const stored = localStorage.getItem('ihsan_location');
    if (!stored) return today;
    const loc = JSON.parse(stored) as { latitude: number; longitude: number };
    const times = calcPrayerTimes(loc.latitude, loc.longitude, new Date());
    const now = new Date();
    // If it's between midnight and Fajr, the user is still in the "previous" Islamic evening
    if (now < times.fajr && now.getHours() < 12) return offsetDate(today, -1);
  } catch { /* ignore */ }
  return today;
}

export default function SalatTracker() {
  const [selectedDate, setSelectedDate] = useState(getDefaultDate);
  const [expandedPrayer, setExpandedPrayer] = useState<PrayerId | null>(null);

  const isToday = selectedDate === todayStr();

  // Start date: the day tracking began (or was reset after deletion).
  // Prevents users from adding entries before this date after a data wipe.
  const salatStartDate = localStorage.getItem('ihsan_salat_start_date') ?? null;
  const isAtStartDate = salatStartDate ? selectedDate <= salatStartDate : false;

  // Prayer times for current-prayer detection (only needed for today)
  const todayPrayerTimes = useMemo(() => {
    const stored = localStorage.getItem('ihsan_location');
    if (!stored) return null;
    try {
      const loc = JSON.parse(stored) as { latitude: number; longitude: number };
      const times = calcPrayerTimes(loc.latitude, loc.longitude, new Date());
      const info = getCurrentAndNextPrayer(times, new Date());
      return {
        times: {
          fajr:    times.fajr,
          dhuhr:   times.dhuhr,
          asr:     times.asr,
          maghrib: times.maghrib,
          isha:    times.isha,
        } as Record<string, Date>,
        nextTime: info.nextTime,
        current: info.current as string,
      };
    } catch { return null; }
  }, []); // computed once on mount; fine for a session

  const { data: log, isLoading } = useSalatLog(selectedDate);
  const updatePrayer = useUpdatePrayer();
  const updateNafl = useUpdateNafl();

  // Nafl state
  const [naflExpanded, setNaflExpanded] = useState(false);
  const [naflInfoExpanded, setNaflInfoExpanded] = useState<NaflType | null>(null);

  const naflEntry = log?.nafl ?? { completed: false, types: [], rakat: 2 };

  const handleNaflToggle = () => {
    const newCompleted = !naflEntry.completed;
    updateNafl.mutate({
      completed: newCompleted,
      types: newCompleted ? naflEntry.types : [],
      rakat: 2, // always reset to default when toggling done/undone
      date: selectedDate,
    });
    if (newCompleted) setNaflExpanded(true);
    else setNaflExpanded(false);
  };

  const handleNaflTypeToggle = (type: NaflType) => {
    const currentTypes = naflEntry.types ?? [];
    const adding = !currentTypes.includes(type);
    const next = adding
      ? [...currentTypes, type]
      : currentTypes.filter((t) => t !== type);
    const minRakat = computeMinRakat(next);
    updateNafl.mutate({
      completed: naflEntry.completed,
      types: next,
      // Adding: keep user's count if already above new min; removing: snap to new min
      rakat: adding ? Math.max(minRakat, naflEntry.rakat ?? 2) : minRakat,
      date: selectedDate,
    });
  };

  const handleNaflRakat = (delta: number) => {
    const minRakat = computeMinRakat(naflEntry.types ?? []);
    const next = Math.max(minRakat, (naflEntry.rakat ?? minRakat) + delta);
    updateNafl.mutate({
      completed: naflEntry.completed,
      types: naflEntry.types ?? [],
      rakat: next,
      date: selectedDate,
    });
  };

  const trackablePrayers = PRAYER_META.filter((p) => p.isTrackable);

  const completedCount = useMemo(() => {
    if (!log) return 0;
    return trackablePrayers.filter((p) => {
      const s = log.prayers[p.id as PrayerId]?.status;
      return s === 'completed' || s === 'kaza';
    }).length;
  }, [log, trackablePrayers]);

  // Handle primary status tap
  const handleStatus = (prayer: PrayerId, status: PrayerStatus) => {
    const current = log?.prayers[prayer];
    // If tapping the already-active status, clear it (toggle off)
    const newStatus: PrayerStatus = current?.status === status ? 'pending' : status;

    // If setting to completed/kaza, open sub-tag row; keep existing location if re-selecting
    if (newStatus === 'completed' || newStatus === 'kaza') {
      updatePrayer.mutate({
        prayer,
        status: newStatus,
        date: selectedDate,
        location: current?.location ?? 'home',
        tasbeeh: current?.tasbeeh ?? false,
      });
      setExpandedPrayer(prayer); // open sub-tags
    } else {
      updatePrayer.mutate({
        prayer,
        status: newStatus,
        date: selectedDate,
      });
      setExpandedPrayer(null);
    }
  };

  // Handle sub-tag change
  const handleSubTag = (prayer: PrayerId, type: 'location' | 'tasbeeh' | 'ayatulKursi', value: PrayerLocation | boolean) => {
    const current = log?.prayers[prayer];
    updatePrayer.mutate({
      prayer,
      status: current?.status as PrayerStatus ?? 'completed',
      date: selectedDate,
      location: type === 'location' ? (value as PrayerLocation) : (current?.location ?? 'home'),
      tasbeeh: type === 'tasbeeh' ? (value as boolean) : (current?.tasbeeh ?? false),
      ayatulKursi: type === 'ayatulKursi' ? (value as boolean) : (current?.ayatulKursi ?? false),
    });
  };

  return (
    <AnimatedBackground variant="dark">
      {/* ── Tab navigation ── */}
      <div className="px-4 pt-3 pb-0">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 max-w-xs">
          <span className="flex-1 text-center text-xs font-bold py-1.5 rounded-lg bg-white/10 text-white">
            🕌 Tracker
          </span>
          <Link
            to="/salat/analytics"
            className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all"
          >
            📊 Analytics
          </Link>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto space-y-5">

          {/* Date navigator */}
          <div className="flex items-center justify-between gap-3">
            <motion.button
              whileHover={isAtStartDate ? {} : { scale: 1.08 }}
              whileTap={isAtStartDate ? {} : { scale: 0.92 }}
              onClick={() => { if (!isAtStartDate) { setSelectedDate((d) => offsetDate(d, -1)); setExpandedPrayer(null); } }}
              disabled={isAtStartDate}
              title={isAtStartDate ? 'No logs before this date' : 'Previous day'}
              className="p-2 rounded-xl bg-brand-surface border border-brand-border text-white/60 hover:text-white hover:border-brand-emerald/40 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </motion.button>
            <div className="text-center">
              <p className="text-white font-bold text-base">{friendlyDate(selectedDate)}</p>
              <p className="text-white/30 text-xs">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {(() => { const h = getHijriDate(new Date(selectedDate + 'T12:00:00')); return h ? <p className="text-brand-gold/40 text-[10px] mt-0.5">{formatHijriDate(h)}</p> : null; })()}
            </div>
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => { setSelectedDate((d) => offsetDate(d, 1)); setExpandedPrayer(null); }}
              disabled={isToday}
              className="p-2 rounded-xl bg-brand-surface border border-brand-border text-white/60 hover:text-white hover:border-brand-emerald/40 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Progress bar */}
          <div className="card bg-gradient-to-br from-brand-emerald/10 to-brand-deep border border-brand-emerald/20 rounded-2xl">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wide">
                  {friendlyDate(selectedDate)}'s Prayers
                </span>
                <span className="text-xl font-black text-brand-emerald">
                  {completedCount}<span className="text-white/30 font-normal text-base">/5</span>
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-emerald to-cyan-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / 5) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              {completedCount === 5 && (
                <p className="text-brand-emerald text-xs mt-1 font-semibold">🎉 All prayers completed — MashaAllah!</p>
              )}
            </div>
          </div>

          {/* Prayer cards */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-brand-emerald" />
            </div>
          ) : (
            <div className="space-y-2">
              {trackablePrayers.map((prayer, i) => {
                const prayerId = prayer.id as PrayerId;
                const entry = log?.prayers[prayerId];
                // Normalise legacy DB values (old model used 'prayed'/'mosque') to new schema
                const rawStatus = (entry?.status ?? 'pending') as string;
                const status: PrayerStatus =
                  rawStatus === 'prayed' || rawStatus === 'mosque' ? 'completed' :
                  (rawStatus in STATUS_STYLE ? rawStatus as PrayerStatus : 'pending');
                const style = STATUS_STYLE[status] ?? STATUS_STYLE['pending'];
                const isCurrent = isToday && isCurrentPrayer(prayerId, todayPrayerTimes?.current);
                const isFuture = isToday && isFuturePrayer(prayerId, todayPrayerTimes?.times);
                const isExpanded = expandedPrayer === prayerId;
                const hasSubTag = status === 'completed' || status === 'kaza';

                // Current prayer time (if available)
                const prayerStartTime = todayPrayerTimes?.times[prayerId] instanceof Date
                  ? formatTime(todayPrayerTimes.times[prayerId])
                  : null;

                return (
                  <motion.div
                    key={prayer.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    transition={{ delay: 0.04 * i }}
                    layout
                    className={`rounded-2xl border overflow-hidden transition-colors ${
                      isCurrent
                        ? 'bg-brand-emerald/10 border-brand-emerald/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                        : `${style.bg} ${style.border}`
                    }`}
                  >
                    {/* Main row */}
                    <div className="p-3 flex items-center gap-3">
                      {/* Prayer info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl shrink-0">{prayer.icon}</span>
                        <div className="min-w-0">
                          <p className={`font-bold text-sm leading-none ${isCurrent ? 'text-brand-emerald' : style.text}`}>
                            {prayerId === 'dhuhr' && isToday && isFriday() ? "Jumu'ah" : prayer.name}
                            {isCurrent && <span className="ml-2 text-xs font-normal text-brand-emerald/70">● now</span>}
                            {prayerId === 'dhuhr' && isToday && isFriday() && (
                              <span className="ml-2 text-xs font-normal text-brand-emerald/60">🕌 congregation</span>
                            )}
                          </p>
                          {prayerStartTime && isToday && (
                            <p className="text-white/30 text-xs mt-0.5">{prayerStartTime}</p>
                          )}
                          {prayerId === 'dhuhr' && isToday && isFriday() && (
                            <p className="text-brand-emerald/50 text-xs mt-0.5">replaces Dhuhr — attend at mosque</p>
                          )}
                        </div>
                      </div>

                      {/* Primary action buttons (future prayers locked for today) */}
                      {isFuture ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/20 text-xs font-medium px-2 py-1 rounded-lg border border-white/10">
                            🔒 not yet
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {/* Completed */}
                          <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={() => handleStatus(prayerId, 'completed')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              status === 'completed'
                                ? 'bg-brand-emerald text-white border-brand-emerald shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                : 'bg-brand-deep border-brand-border text-white/50 hover:border-brand-emerald/50 hover:text-white/80'
                            }`}
                          >
                            ✅ Done
                          </motion.button>
                          {/* Kaza */}
                          <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={() => handleStatus(prayerId, 'kaza')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              status === 'kaza'
                                ? 'bg-brand-gold text-white border-brand-gold shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                : 'bg-brand-deep border-brand-border text-white/50 hover:border-brand-gold/50 hover:text-white/80'
                            }`}
                          >
                            ⏰ Kaza
                          </motion.button>
                          {/* Missed */}
                          <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={() => handleStatus(prayerId, 'missed')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              status === 'missed'
                                ? 'bg-red-500 text-white border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                                : 'bg-brand-deep border-brand-border text-white/50 hover:border-red-400/50 hover:text-white/80'
                            }`}
                          >
                            ❌ Missed
                          </motion.button>
                        </div>
                      )}
                    </div>

                    {/* Sub-tags row (only for completed/kaza) */}
                    <AnimatePresence>
                      {hasSubTag && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden border-t border-white/10"
                        >
                          <div className="px-3 py-2.5 space-y-2">
                            {/* Location tags — only for completed (kaza is always prayed alone) */}
                            {status === 'completed' && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white/30 text-xs">Where:</span>
                                {LOCATION_TAGS.map((tag) => (
                                  <motion.button
                                    key={tag.value}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleSubTag(prayerId, 'location', tag.value)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                                      entry?.location === tag.value || (!entry?.location && tag.value === 'home')
                                        ? 'bg-brand-emerald/20 border-brand-emerald/60 text-brand-emerald'
                                        : 'bg-brand-deep border-brand-border text-white/40 hover:text-white/70'
                                    }`}
                                  >
                                    <span>{tag.emoji}</span> {tag.label}
                                    <span className="text-white/25 text-xs hidden sm:inline">({tag.note})</span>
                                  </motion.button>
                                ))}
                              </div>
                            )}
                            {/* After-salat toggles */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white/30 text-xs shrink-0">After salat:</span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleSubTag(prayerId, 'tasbeeh', !(entry?.tasbeeh ?? false))}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                                  entry?.tasbeeh
                                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                                    : 'bg-brand-deep border-brand-border text-white/40 hover:text-white/70'
                                }`}
                              >
                                📿 Tasbeeh
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleSubTag(prayerId, 'ayatulKursi', !(entry?.ayatulKursi ?? false))}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                                  entry?.ayatulKursi
                                    ? 'bg-brand-gold/20 border-brand-gold/60 text-brand-gold'
                                    : 'bg-brand-deep border-brand-border text-white/40 hover:text-white/70'
                                }`}
                              >
                                📖 Ayatul Kursi
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Expand/collapse toggle for sub-tags (only when completed/kaza) */}
                    {hasSubTag && !isFuture && (
                      <button
                        onClick={() => setExpandedPrayer(isExpanded ? null : prayerId)}
                        className="w-full flex items-center justify-center gap-1 py-1 border-t border-white/5 text-white/20 hover:text-white/50 text-xs transition-colors"
                      >
                        {isExpanded ? '▲ Less' : '▾ Details'}
                        {status === 'completed' && entry?.location && entry.location !== 'home' && (
                          <span className="text-brand-emerald/60">{LOCATION_TAGS.find((t) => t.value === entry.location)?.emoji}</span>
                        )}
                        {entry?.tasbeeh && <span className="text-cyan-400/60">📿</span>}
                        {entry?.ayatulKursi && <span className="text-brand-gold/60">📖</span>}
                      </button>
                    )}

                    {/* Witr reminder — always shown on Isha card */}
                    {prayerId === 'isha' && (
                      <div className="px-3 py-2.5 border-t border-brand-gold/20 flex items-start gap-2 bg-brand-gold/5">
                        <span className="text-base shrink-0">🕯️</span>
                        <div className="min-w-0">
                          <p className="text-brand-gold font-bold text-xs leading-tight">Don't forget Witr — it's wājib!</p>
                          <p className="text-white/35 text-xs leading-relaxed mt-0.5">
                            Pray Witr after Isha before Fajr — usually 3 rak'ahs with Qunūt du'ā. The Prophet ﷺ never abandoned it, even while travelling.
                          </p>
                          <a
                            href="https://sunnah.com/bukhari:998"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-brand-gold/50 text-xs underline hover:text-brand-gold/80 transition-colors mt-0.5 inline-block"
                          >
                            📖 Ṣaḥīḥ al-Bukhārī 998
                          </a>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Nafl Prayer card */}
          {!isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              layout
              className={`rounded-2xl border overflow-hidden transition-colors ${
                naflEntry.completed
                  ? 'bg-cyan-500/10 border-cyan-400/40'
                  : 'bg-brand-surface border-brand-border'
              }`}
            >
              {/* Header row */}
              <div className="p-3 flex items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl shrink-0">📿</span>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm leading-none ${naflEntry.completed ? 'text-cyan-300' : 'text-white/60'}`}>
                      Nafl Prayer
                    </p>
                    <p className="text-white/25 text-xs mt-0.5">voluntary prayers</p>
                  </div>
                </div>
                {/* Done / Undo button */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={handleNaflToggle}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    naflEntry.completed
                      ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-brand-deep border-brand-border text-white/50 hover:border-cyan-400/50 hover:text-white/80'
                  }`}
                >
                  {naflEntry.completed ? '✅ Done' : 'Mark Done'}
                </motion.button>
              </div>

              {/* Expanded: type selector + rakat */}
              <AnimatePresence>
                {naflEntry.completed && naflExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/10"
                  >
                    <div className="px-3 py-3 space-y-3">

                      {/* Type of prayer — multi select */}
                      <div>
                        <p className="text-white/30 text-xs mb-2">Type of prayer <span className="text-white/20">(select all that apply)</span></p>
                        <div className="flex flex-wrap gap-1.5">
                          {NAFL_TYPE_META.filter((t) => {
                            if (t.id === 'witr') return false;       // shown as Isha note
                            if (t.id === 'tarawih') return isRamadanNow(); // only in Ramadan
                            return true;
                          }).map((t) => {
                            const selected = (naflEntry.types ?? []).includes(t.id);
                            return (
                              <div key={t.id} className="flex flex-col gap-0">
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleNaflTypeToggle(t.id)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                                    selected
                                      ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                                      : 'bg-brand-deep border-brand-border text-white/40 hover:text-white/70'
                                  }`}
                                >
                                  <span>{t.emoji}</span>
                                  <span>{t.label}</span>
                                  {/* Info toggle */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setNaflInfoExpanded(naflInfoExpanded === t.id ? null : t.id); }}
                                    className="text-white/20 hover:text-white/50 text-xs ml-0.5"
                                  >ⓘ</button>
                                </motion.button>
                                {/* Short note always visible */}
                                <p className="text-white/20 text-xs px-1 mt-0.5">{t.shortNote}</p>
                                {/* Full note on expand */}
                                <AnimatePresence>
                                  {naflInfoExpanded === t.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mx-1 mt-1 mb-1 p-2 rounded-lg bg-brand-deep border border-white/10 space-y-1">
                                        <p className="text-white/50 text-xs leading-relaxed">{t.fullNote}</p>
                                        <p className="text-white/25 text-xs italic">{t.hadith}</p>
                                        <a
                                          href={t.hadithUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-cyan-400/50 text-xs underline hover:text-cyan-300/80"
                                        >
                                          📖 sunnah.com
                                        </a>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Rakat counter */}
                      {(() => {
                        const minRakat = computeMinRakat(naflEntry.types ?? []);
                        const currentRakat = naflEntry.rakat ?? minRakat;
                        return (
                          <div className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition-colors ${minRakat > 2 ? 'bg-cyan-500/8 border border-cyan-400/20' : ''}`}>
                            <p className="text-white/30 text-xs">Rak'ahs prayed:</p>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => handleNaflRakat(-2)}
                                disabled={currentRakat <= minRakat}
                                className="w-7 h-7 rounded-lg bg-brand-deep border border-brand-border text-white/60 font-bold text-base flex items-center justify-center disabled:opacity-25 hover:border-cyan-400/40 hover:text-white transition-all"
                              >−</motion.button>
                              <span className="text-white font-black text-lg tabular-nums w-8 text-center">
                                {currentRakat}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => handleNaflRakat(2)}
                                className="w-7 h-7 rounded-lg bg-brand-deep border border-brand-border text-white/60 font-bold text-base flex items-center justify-center hover:border-cyan-400/40 hover:text-white transition-all"
                              >+</motion.button>
                            </div>
                            <p className="text-white/20 text-xs">min {minRakat}r</p>
                          </div>
                        );
                      })()}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expand toggle */}
              {naflEntry.completed && (
                <button
                  onClick={() => setNaflExpanded(!naflExpanded)}
                  className="w-full flex items-center justify-center gap-1 py-1 border-t border-white/5 text-white/20 hover:text-white/50 text-xs transition-colors"
                >
                  {naflExpanded ? '▲ Less' : '▾ Details'}
                  {(naflEntry.types?.length ?? 0) > 0 && (
                    <span className="text-cyan-400/50 text-xs">
                      {naflEntry.types.map((t) => NAFL_TYPE_META.find((m) => m.id === t)?.emoji).join(' ')}
                    </span>
                  )}
                  {naflEntry.rakat > 2 && (
                    <span className="text-white/25 text-xs">{naflEntry.rakat}r</span>
                  )}
                </button>
              )}
            </motion.div>
          )}

          {/* Legend */}
          <div className="card bg-brand-surface border border-brand-border rounded-2xl">
            <div className="card-body p-4">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-wide mb-3">How it works</p>
              <div className="space-y-1.5 text-xs text-white/50">
                <p>✅ <span className="text-white/70 font-medium">Done</span> — prayed on time</p>
                <p>⏰ <span className="text-white/70 font-medium">Kaza</span> — prayed late (still counts as prayed)</p>
                <p>❌ <span className="text-white/70 font-medium">Missed</span> — not prayed</p>
                <p>🕌 <span className="text-white/70 font-medium">Mosque</span> or 👥 <span className="text-white/70 font-medium">Jamat</span> — tap ▾ Details after marking done</p>
                <p>🔒 Future prayers are locked until their time begins</p>
                <p>📖 <span className="text-white/70 font-medium">Ayatul Kursi</span> — toggle after marking Done/Kaza (tap ▾ Details)</p>
                <p>📿 <span className="text-white/70 font-medium">Nafl</span> — mark voluntary prayers and pick type + rak\'ahs</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AnimatedBackground>
  );
}
