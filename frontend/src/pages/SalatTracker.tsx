import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { ArrowLeftIcon, ChartBarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  useSalatLog,
  useUpdatePrayer,
  PrayerId,
  PrayerStatus,
  PrayerLocation,
} from '../hooks/useSalatLog.js';
import {
  PRAYER_META,
  calcPrayerTimes,
  getCurrentAndNextPrayer,
  formatTime,
} from '../utils/prayerTimes.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().substring(0, 10); }
function offsetDate(base: string, delta: number): string {
  const d = new Date(base + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().substring(0, 10);
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

export default function SalatTracker() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [expandedPrayer, setExpandedPrayer] = useState<PrayerId | null>(null);

  const isToday = selectedDate === todayStr();

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

  const { data: log, isLoading } = useSalatLog(isToday ? undefined : selectedDate);
  const updatePrayer = useUpdatePrayer();

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
        date: isToday ? undefined : selectedDate,
        location: current?.location ?? 'home',
        tasbeeh: current?.tasbeeh ?? false,
      });
      setExpandedPrayer(prayer); // open sub-tags
    } else {
      updatePrayer.mutate({
        prayer,
        status: newStatus,
        date: isToday ? undefined : selectedDate,
      });
      setExpandedPrayer(null);
    }
  };

  // Handle sub-tag change
  const handleSubTag = (prayer: PrayerId, type: 'location' | 'tasbeeh', value: PrayerLocation | boolean) => {
    const current = log?.prayers[prayer];
    updatePrayer.mutate({
      prayer,
      status: current?.status as PrayerStatus ?? 'completed',
      date: isToday ? undefined : selectedDate,
      location: type === 'location' ? (value as PrayerLocation) : (current?.location ?? 'home'),
      tasbeeh: type === 'tasbeeh' ? (value as boolean) : (current?.tasbeeh ?? false),
    });
  };

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto space-y-5">

          {/* Nav row */}
          <div className="flex items-center justify-between">
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-surface/90 backdrop-blur-md border border-brand-border text-white text-sm font-semibold"
            >
              <ArrowLeftIcon className="w-4 h-4" /> Back
            </motion.button>
            <motion.button
              onClick={() => navigate('/salat/analytics')}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-surface/90 backdrop-blur-md border border-brand-border text-white text-sm font-semibold"
            >
              <ChartBarIcon className="w-4 h-4" /> Analytics
            </motion.button>
          </div>

          {/* Date navigator */}
          <div className="flex items-center justify-between gap-3">
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => { setSelectedDate((d) => offsetDate(d, -1)); setExpandedPrayer(null); }}
              className="p-2 rounded-xl bg-brand-surface border border-brand-border text-white/60 hover:text-white hover:border-brand-emerald/40"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </motion.button>
            <div className="text-center">
              <p className="text-white font-bold text-base">{friendlyDate(selectedDate)}</p>
              <p className="text-white/30 text-xs">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
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
                const status = entry?.status ?? 'pending';
                const style = STATUS_STYLE[status];
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
                            {prayer.name}
                            {isCurrent && <span className="ml-2 text-xs font-normal text-brand-emerald/70">● now</span>}
                          </p>
                          {prayerStartTime && isToday && (
                            <p className="text-white/30 text-xs mt-0.5">{prayerStartTime}</p>
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
                            {/* Location tags */}
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
                            {/* Tasbeeh toggle */}
                            <div className="flex items-center gap-2">
                              <span className="text-white/30 text-xs">After salat:</span>
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
                        {(entry?.location && entry.location !== 'home') && <span className="text-brand-emerald/60">{LOCATION_TAGS.find((t) => t.value === entry.location)?.emoji}</span>}
                        {entry?.tasbeeh && <span className="text-cyan-400/60">📿</span>}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
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
              </div>
            </div>
          </div>

        </div>
      </div>
    </AnimatedBackground>
  );
}
