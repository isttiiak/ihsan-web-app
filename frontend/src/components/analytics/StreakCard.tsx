import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { FireIcon, TrophyIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { PauseIcon, PlayIcon, BoltIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { ChartDataPoint } from '../../types/api.js';

interface StreakData {
  currentStreak?: number;
  longestStreak?: number;
  isPaused?: boolean;
}

interface StreakCardProps {
  streak?: StreakData;
  onPause: () => void;
  onResume: () => void;
  isLoading: boolean;
  chartData?: ChartDataPoint[];
  dailyGoal?: number | null;
  todayTotal?: number;
}

function heatmapColor(total: number, goal: number | null | undefined): string {
  if (total === 0) return 'rgba(255,255,255,0.06)';
  if (!goal) return 'rgba(16,185,129,0.5)';
  const pct = total / goal;
  if (pct >= 1) return 'rgba(16,185,129,0.85)';
  if (pct >= 0.5) return 'rgba(16,185,129,0.45)';
  if (pct > 0) return 'rgba(245,158,11,0.55)';
  return 'rgba(255,255,255,0.06)';
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function StreakCard({ streak, onPause, onResume, isLoading, chartData, dailyGoal, todayTotal = 0 }: StreakCardProps) {
  const { currentStreak, longestStreak, isPaused } = streak || {};
  const prefersReducedMotion = useReducedMotion();

  // Last 7 days from chartData (most recent last)
  const last7 = (chartData ?? []).slice(-7);

  // Streak-at-risk: after 6 PM, streak active, today < goal
  const hour = new Date().getHours();
  const remaining = dailyGoal ? Math.max(0, dailyGoal - todayTotal) : 0;
  const streakAtRisk = (currentStreak ?? 0) > 0
    && !isPaused
    && hour >= 18
    && remaining > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`relative overflow-hidden rounded-[1.25rem] backdrop-blur-2xl border bg-brand-deep/60 text-white shadow-glass ${
        isPaused ? 'border-rose-400/40' : streakAtRisk ? 'border-brand-gold/50' : 'border-white/10'
      }`}
    >
      <motion.div
        className="pointer-events-none absolute -top-20 -left-16 w-72 h-72 rounded-full blur-3xl bg-gradient-radial from-brand-gold/45 to-transparent"
        animate={prefersReducedMotion ? {} : { scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 -right-20 w-80 h-80 rounded-full blur-3xl bg-gradient-radial from-brand-magenta/35 to-transparent"
        animate={prefersReducedMotion ? {} : { scale: [1.1, 1, 1.1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative z-10 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <motion.h3
            className="text-base sm:text-lg font-extrabold flex items-center gap-2"
            animate={!isPaused && !prefersReducedMotion ? { scale: [1, 1.01, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            {isPaused ? (
              <span className="relative inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.8)] animate-pulse" />
                <span className="px-2 py-0.5 rounded-full text-[11px] uppercase font-black tracking-wider bg-gradient-to-r from-brand-magenta/90 via-brand-magenta/80 to-brand-gold/80 text-white ring-1 ring-inset ring-rose-200/40">
                  Paused
                </span>
              </span>
            ) : (
              <>
                <FireIcon className="w-5 h-5" />
                Streak
              </>
            )}
          </motion.h3>

          <motion.button
            onClick={isPaused ? onResume : onPause}
            disabled={isLoading}
            whileHover={{ scale: 1.08, rotate: isPaused ? 0 : 2 }}
            whileTap={{ scale: 0.95 }}
            className={`w-10 h-10 rounded-2xl grid place-items-center border ${
              isPaused ? 'border-emerald-300/40 bg-emerald-400/15' : 'border-white/30 bg-white/10'
            } backdrop-blur-md hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60 disabled:cursor-not-allowed`}
            title={isPaused ? 'Resume Streak' : 'Pause Streak'}
          >
            {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
          </motion.button>
        </div>

        {/* Paused banner */}
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 relative overflow-hidden rounded-lg border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-600/20 via-purple-600/20 to-fuchsia-600/20 text-white backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-extrabold uppercase tracking-wider">
              <ExclamationTriangleIcon className="w-4 h-4 text-fuchsia-200" />
              <span className="text-fuchsia-100">Streak Paused — counts won't increase until you resume</span>
            </div>
          </motion.div>
        )}

        {/* Streak-at-risk alert */}
        {streakAtRisk && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-brand-gold/50 bg-brand-gold/10"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ExclamationTriangleIcon className="w-4 h-4 text-brand-gold shrink-0" />
              <p className="text-xs font-bold text-brand-gold leading-tight">
                {remaining} more to protect your {currentStreak}-day streak!
              </p>
            </div>
            <Link
              to="/zikr"
              className="shrink-0 px-2.5 py-1 rounded-lg bg-brand-gold text-brand-deep text-[11px] font-black whitespace-nowrap hover:bg-amber-400 transition-colors"
            >
              Count now →
            </Link>
          </motion.div>
        )}

        {/* Current / Best row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center">
            <motion.div
              animate={!prefersReducedMotion && !isPaused && (currentStreak ?? 0) > 0 ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="text-8xl sm:text-5xl font-black drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)] bg-gradient-to-tr from-brand-gold via-brand-gold to-brand-magenta bg-clip-text text-transparent"
            >
              {currentStreak || 0}
            </motion.div>
            <p className="text-xs font-bold text-white/85">Day Streak</p>
          </div>

          <div className="text-center border-l border-white/10">
            <motion.div className="relative inline-block px-2 py-1" whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}>
              <span className="absolute -inset-3 rounded-full bg-gradient-radial from-brand-gold/25 to-transparent blur-md" />
              {!prefersReducedMotion && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute rounded-full blur-xl opacity-60"
                      style={{
                        width: `${18 + (i % 3) * 8}px`, height: `${18 + (i % 3) * 8}px`,
                        left: ['-18%', '35%', '110%', '60%', '-8%', '95%'][i],
                        top: ['-10%', '-15%', '0%', '60%', '40%', '25%'][i],
                        background: i % 2 === 0
                          ? 'radial-gradient(circle, rgba(214,197,43,0.55) 0%, rgba(214,197,43,0) 70%)'
                          : 'radial-gradient(circle, rgba(199,87,171,0.45) 0%, rgba(199,87,171,0) 70%)',
                      }}
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: [0.8, 1.15, 0.9, 1], opacity: [0.5, 0.9, 0.6, 0.8] }}
                      transition={{ duration: 4 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  ))}
                </>
              )}
              <span
                className="relative text-6xl sm:text-4xl font-black"
                style={{ background: 'linear-gradient(180deg,#fff,#f5f3c4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }}
              >
                {longestStreak || 0}
              </span>
            </motion.div>
            <p className="text-sm font-bold text-white/70 flex items-center justify-center gap-1">
              Best <TrophyIcon className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* 7-day heatmap */}
        {last7.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-bold">Last 7 days</p>
            <div className="flex gap-1.5 items-end">
              {last7.map((day, i) => {
                const isToday = i === last7.length - 1;
                const color = heatmapColor(day.total, dailyGoal);
                const pct = dailyGoal ? Math.min(1, day.total / dailyGoal) : (day.total > 0 ? 0.6 : 0);
                const height = 8 + Math.round(pct * 20); // 8–28px
                return (
                  <div
                    key={day.date}
                    className="tooltip flex-1"
                    data-tip={`${formatShortDate(day.date)}: ${day.total.toLocaleString()} zikr${dailyGoal ? ` (${Math.round((day.total / dailyGoal) * 100)}% of goal)` : ''}`}
                  >
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
                      style={{ height, background: color, originY: 1 }}
                      className={`w-full rounded-t-sm ${isToday ? 'ring-1 ring-white/30' : ''}`}
                    />
                    <p className={`text-[9px] text-center mt-0.5 ${isToday ? 'text-white/60 font-bold' : 'text-white/20'}`}>
                      {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </p>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 mt-1.5">
              {[
                { color: 'rgba(255,255,255,0.06)', label: '0' },
                { color: 'rgba(245,158,11,0.55)', label: '<50%' },
                { color: 'rgba(16,185,129,0.45)', label: '50%+' },
                { color: 'rgba(16,185,129,0.85)', label: 'Goal' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
                  <span className="text-[9px] text-white/25">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status line */}
        {!isPaused && (currentStreak ?? 0) > 0 && !streakAtRisk && (
          <motion.div
            className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/15 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <p className="text-xs text-center font-semibold text-white/90 flex items-center justify-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4" /> Keep it up! Strong habit.
            </p>
          </motion.div>
        )}

        {isPaused && (
          <motion.div
            className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/15 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                <PauseIcon className="w-4 h-4" /> Safe. Resume anytime!
              </p>
              <motion.button
                onClick={onResume}
                disabled={isLoading}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black text-white bg-brand-emerald/80 hover:bg-brand-emerald/90 border border-emerald-300/40 disabled:opacity-60"
              >
                <PlayIcon className="w-3.5 h-3.5" />
                Resume now
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* How streaks work */}
        <motion.div
          className="p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <p className="text-base font-bold text-white/95 mb-2 flex items-center gap-1.5">
            <BoltIcon className="w-4 h-4" /> How Streaks Work:
          </p>
          <div className="space-y-1.5 text-sm text-white/85">
            <p className="flex items-start gap-2">
              <CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Complete your daily zikr goal to continue your streak</span>
            </p>
            <p className="flex items-start gap-2">
              <FireIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Miss 1 day? No problem! You get a 24-hour grace period</span>
            </p>
            <p className="flex items-start gap-2">
              <PauseIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Pause anytime to preserve your streak safely</span>
            </p>
            <p className="flex items-start gap-2">
              <LockClosedIcon className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-80" />
              <span className="text-xs italic opacity-75">Note: Missing 2+ days in a row will reset your streak</span>
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
