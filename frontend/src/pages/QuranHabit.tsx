import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { celebrateGoal, celebrateKhatm } from '../utils/celebrate.js';
import { PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import {
  useQuranSummary,
  useLogReading,
  useUpdateQuranProfile,
  juzForPage,
  QURAN_TOTAL_PAGES,
} from '../hooks/useQuran.js';

// All references verified against sunnah.com on 2026-07-02
const QURAN_VIRTUES = [
  {
    text: '"Whoever recites a letter from the Book of Allah, he will be credited with a good deed, and a good deed gets a ten-fold reward. I do not say that Alif-Lām-Mīm is one letter — Alif is a letter, Lām is a letter and Mīm is a letter."',
    source: 'Jāmiʿ al-Tirmidhī 2910',
    url: 'https://sunnah.com/tirmidhi:2910',
    grade: 'Ṣaḥīḥ',
  },
  {
    text: '"Recite the Quran, for on the Day of Resurrection it will come as an intercessor for its companions."',
    source: 'Ṣaḥīḥ Muslim 804',
    url: 'https://sunnah.com/muslim:804a',
    grade: 'Ṣaḥīḥ',
  },
  {
    text: '"The best among you are those who learn the Quran and teach it."',
    source: 'Ṣaḥīḥ al-Bukhārī 5027',
    url: 'https://sunnah.com/bukhari:5027',
    grade: 'Ṣaḥīḥ',
  },
];

// Celebration sparkles when the daily goal is reached
const SPARKLES = [
  { x: -50, y: -34, d: 0.0 }, { x: 46, y: -40, d: 0.08 }, { x: -34, y: 30, d: 0.16 },
  { x: 56, y: 22, d: 0.24 }, { x: 0, y: -56, d: 0.12 }, { x: -60, y: -6, d: 0.2 },
];

/** Animated circular progress ring */
function ProgressRing({ progress, size = 190 }: { progress: number; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={clamped >= 1 ? '#10b981' : '#f59e0b'}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c}
        animate={{ strokeDashoffset: c * (1 - clamped) }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 8px ${clamped >= 1 ? '#10b98180' : '#f59e0b60'})` }}
      />
    </svg>
  );
}

export default function QuranHabit() {
  const { data: summary, isLoading } = useQuranSummary();
  const logReading = useLogReading();
  const updateProfile = useUpdateQuranProfile();

  const [customPages, setCustomPages] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [editingPage, setEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const [advance, setAdvance] = useState(true);
  const [celebrate, setCelebrate] = useState(false);

  const goal = summary?.profile.dailyGoalPages ?? 2;
  const todayPages = summary?.todayPages ?? 0;
  const progress = goal > 0 ? todayPages / goal : 0;
  const currentPage = summary?.profile.currentPage ?? 0;
  const khatmPct = (currentPage / QURAN_TOTAL_PAGES) * 100;
  const currentJuz = juzForPage(Math.min(QURAN_TOTAL_PAGES, currentPage + 1));

  const addPages = (pages: number) => {
    if (pages <= 0) return;
    const willMeetGoal = todayPages < goal && todayPages + pages >= goal;
    logReading.mutate({ pages, advancePosition: advance }, {
      onSuccess: (data) => {
        if (data.khatmCompleted) {
          toast.success('🎉 Khatm complete! May Allah accept your recitation!', { duration: 6000 });
          celebrateKhatm();
        }
      },
    });
    if (willMeetGoal) {
      setCelebrate(true);
      celebrateGoal();
      setTimeout(() => setCelebrate(false), 1600);
    }
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const submitCustom = () => {
    const p = parseFloat(customPages);
    if (!Number.isFinite(p) || p <= 0) return;
    addPages(Math.min(604, p));
    setCustomPages('');
    setShowCustom(false);
  };

  const saveGoal = () => {
    const g = parseInt(goalInput, 10);
    if (Number.isFinite(g) && g >= 1 && g <= 604) {
      updateProfile.mutate({ dailyGoalPages: g });
    }
    setEditingGoal(false);
  };

  const savePage = () => {
    const p = parseInt(pageInput, 10);
    if (Number.isFinite(p) && p >= 0 && p <= 603) {
      updateProfile.mutate({ currentPage: p });
    }
    setEditingPage(false);
  };

  if (isLoading) {
    return (
      <AnimatedBackground variant="dark">
        <div className="min-h-[60vh] grid place-items-center">
          <span className="loading loading-spinner loading-lg text-brand-emerald" />
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Quran Habit</h1>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto space-y-4">

          {/* ── HERO: today's ring ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className={`relative rounded-3xl border border-white/15 overflow-hidden shadow-2xl bg-gradient-to-br ${
              summary?.goalMet ? 'from-brand-emerald/25 via-teal-700/15 to-brand-deep' : 'from-brand-gold/15 via-brand-deep to-brand-deep'
            }`}
          >
            <motion.div
              className="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative p-5 sm:p-6 flex flex-col items-center">
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-3">📖 Today's Reading</p>

              {/* Ring + center content */}
              <div className="relative grid place-items-center">
                <ProgressRing progress={progress} />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center relative">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={todayPages}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="text-5xl font-black text-white tabular-nums leading-none"
                      >
                        {todayPages % 1 === 0 ? todayPages : todayPages.toFixed(1)}
                      </motion.p>
                    </AnimatePresence>
                    <p className="text-white/40 text-xs mt-1">of {goal} page{goal === 1 ? '' : 's'}</p>
                    {summary?.goalMet && (
                      <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-brand-emerald text-xs font-bold mt-0.5">
                        🏆 Goal met!
                      </motion.p>
                    )}
                    {/* goal-met sparkles */}
                    <AnimatePresence>
                      {celebrate && SPARKLES.map((s, i) => (
                        <motion.span
                          key={i}
                          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                          animate={{ x: s.x, y: s.y, scale: 1.3, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.1, delay: s.d, ease: 'easeOut' }}
                          className="absolute top-1/2 left-1/2 text-xl pointer-events-none"
                        >✨</motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Quick add buttons */}
              <div className="flex items-center gap-2 mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                  onClick={() => addPages(1)}
                  className="h-12 px-6 rounded-2xl bg-brand-emerald hover:bg-brand-emerald-dim text-white font-black text-base border-0 shadow-[0_6px_24px_rgba(16,185,129,0.35)]"
                >+1 page</motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                  onClick={() => addPages(5)}
                  className="h-12 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm"
                >+5</motion.button>
                {showCustom ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min="0.5" step="0.5" value={customPages}
                      onChange={(e) => setCustomPages(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitCustom(); }}
                      placeholder="pages"
                      aria-label="Custom pages"
                      className="input input-sm w-20 bg-brand-deep border-brand-border text-white text-center"
                      autoFocus
                    />
                    <button onClick={submitCustom} aria-label="Add custom pages"
                      className="h-8 w-8 rounded-xl bg-brand-emerald text-white grid place-items-center">
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowCustom(true)}
                    className="h-12 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 font-bold text-sm">
                    …
                  </button>
                )}
              </div>

              {/* Move-bookmark toggle + goal edit */}
              <div className="flex items-center justify-between w-full mt-4 pt-3 border-t border-white/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox" checked={advance} onChange={(e) => setAdvance(e.target.checked)}
                    className="toggle toggle-xs toggle-success"
                  />
                  <span className="text-white/40 text-[11px]">also move my bookmark</span>
                </label>
                {editingGoal ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min="1" max="604" value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveGoal(); }}
                      aria-label="Daily goal pages"
                      className="input input-xs w-14 bg-brand-deep border-brand-border text-white text-center"
                      autoFocus
                    />
                    <button onClick={saveGoal} className="btn btn-xs bg-brand-emerald text-white border-0">Set</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setGoalInput(String(goal)); setEditingGoal(true); }}
                    title="Your minimum daily reading — counts toward your Noor and the friends leaderboard"
                    className="flex items-center gap-1 text-white/40 hover:text-white text-[11px] font-semibold"
                  >
                    <PencilIcon className="w-3 h-3" /> Daily minimum: {goal} page{goal === 1 ? '' : 's'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Khatm progress ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-white/70 font-bold text-sm">🕋 Khatm journey</p>
              <div className="flex items-center gap-2">
                {(summary?.profile.khatmCount ?? 0) > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-[10px] font-bold">
                    ⭐ {summary?.profile.khatmCount} khatm{(summary?.profile.khatmCount ?? 0) > 1 ? 's' : ''} completed
                  </span>
                )}
              </div>
            </div>

            {/* Full-Quran bar with juz ticks */}
            <div className="relative">
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <motion.div
                  animate={{ width: `${khatmPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-emerald via-teal-400 to-cyan-400"
                  style={{ boxShadow: '0 0 12px rgba(16,185,129,0.5)' }}
                />
              </div>
              {/* juz markers every 5 juz */}
              <div className="absolute inset-0 flex justify-between px-[1px] pointer-events-none">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-px h-3 bg-black/30" />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="text-white/50">
                {editingPage ? (
                  <span className="flex items-center gap-1">
                    page
                    <input
                      type="number" min="0" max="603" value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') savePage(); }}
                      aria-label="Current page"
                      className="input input-xs w-16 bg-brand-deep border-brand-border text-white text-center"
                      autoFocus
                    />
                    <button onClick={savePage} className="btn btn-xs bg-brand-emerald text-white border-0">Set</button>
                  </span>
                ) : (
                  <button onClick={() => { setPageInput(String(currentPage)); setEditingPage(true); }}
                    className="flex items-center gap-1 hover:text-white">
                    <PencilIcon className="w-3 h-3" />
                    Page <b className="text-white">{currentPage}</b>/{QURAN_TOTAL_PAGES} · Juz <b className="text-white">{currentJuz}</b>
                  </button>
                )}
              </div>
              <span className="text-brand-emerald font-bold tabular-nums">{khatmPct.toFixed(1)}%</span>
            </div>

            {summary?.estDaysToKhatm != null && summary.pace != null && (
              <p className="text-white/30 text-[11px]">
                📈 At your pace (~{summary.pace} pages/day) you'll complete this khatm in about{' '}
                <b className="text-brand-gold/80">{summary.estDaysToKhatm} days</b>, in shā' Allāh.
              </p>
            )}
          </motion.div>

          {/* ── Streak + week ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 font-bold text-sm">
                🔥 <span className="text-brand-gold">{summary?.streak ?? 0}</span> day streak
              </p>
              <p className="text-white/30 text-[11px]">best: {summary?.bestStreak ?? 0} days</p>
            </div>
            {/* 7-day mini bars */}
            <div className="flex items-end justify-between gap-1.5 h-16">
              {(summary?.last7 ?? []).map((d) => {
                const max = Math.max(goal, ...(summary?.last7 ?? []).map((x) => x.pages), 1);
                const h = d.pages > 0 ? Math.max(14, (d.pages / max) * 100) : 6;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.5 }}
                      className={`w-full rounded-md ${d.pages >= goal ? 'bg-brand-emerald' : d.pages > 0 ? 'bg-brand-gold/70' : 'bg-white/10'}`}
                      title={`${d.pages} pages`}
                    />
                    <span className="text-white/25 text-[9px]">
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-white/30">
              <span>Last 30 days: <b className="text-white/60">{summary?.stats.last30Pages ?? 0}</b> pages</span>
              <span>All time: <b className="text-white/60">{summary?.stats.allTimePages ?? 0}</b> pages</span>
            </div>
          </motion.div>

          {/* ── Virtues ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 space-y-3"
          >
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">📖 Why read every day?</p>
            {QURAN_VIRTUES.map((v) => (
              <div key={v.url} className="space-y-0.5">
                <p className="text-white/50 text-xs italic leading-relaxed">{v.text}</p>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-brand-emerald/60 text-[10px] font-semibold bg-brand-emerald/10 px-1.5 py-0.5 rounded-full">{v.grade}</span>
                  <a href={v.url} target="_blank" rel="noopener noreferrer"
                    className="text-brand-gold/60 text-[10px] underline hover:text-brand-gold/90">
                    {v.source} ↗
                  </a>
                </span>
              </div>
            ))}
            <p className="text-white/25 text-[10px] pt-1">
              💡 One page a day is ~20 minutes a month with the Book of Allah. Consistency beats quantity —
              read on <a href="https://quran.com" target="_blank" rel="noopener noreferrer" className="underline text-white/40 hover:text-white/60">quran.com ↗</a>
            </p>
          </motion.div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
