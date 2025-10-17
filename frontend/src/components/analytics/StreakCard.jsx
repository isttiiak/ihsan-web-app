import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  FireIcon,
  TrophyIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import {
  PauseIcon,
  PlayIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function StreakCard({ streak, onPause, onResume, isLoading }) {
  const { currentStreak, longestStreak, isPaused } = streak || {};
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`relative overflow-hidden rounded-[1.25rem] backdrop-blur-2xl border bg-brand-deep/60 text-white shadow-glass ${
        isPaused ? "border-rose-400/40" : "border-white/10"
      }`}
    >
      {/* Warm accent glows for Streak theme */}
      <motion.div
        className="pointer-events-none absolute -top-20 -left-16 w-72 h-72 rounded-full blur-3xl bg-gradient-radial from-brand-gold/45 to-transparent"
        animate={
          prefersReducedMotion
            ? {}
            : { scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }
        }
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 -right-20 w-80 h-80 rounded-full blur-3xl bg-gradient-radial from-brand-magenta/35 to-transparent"
        animate={prefersReducedMotion ? {} : { scale: [1.1, 1, 1.1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative z-10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <motion.h3
            className="text-base sm:text-lg font-extrabold flex items-center gap-2"
            animate={
              !isPaused && !prefersReducedMotion ? { scale: [1, 1.01, 1] } : {}
            }
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            {isPaused ? (
              <>
                <span className="relative inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.8)] animate-pulse" />
                  <span
                    aria-live="polite"
                    className="px-2 py-0.5 rounded-full text-[11px] uppercase font-black tracking-wider bg-gradient-to-r from-brand-magenta/90 via-brand-magenta/80 to-brand-gold/80 text-white ring-1 ring-inset ring-rose-200/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                  >
                    Paused
                  </span>
                </span>
              </>
            ) : (
              <>
                <FireIcon className="w-5 h-5" />
                Streak
              </>
            )}
          </motion.h3>

          {/* Simplified Pause/Resume button (removed conic ring and gloss) */}
          <motion.button
            onClick={isPaused ? onResume : onPause}
            disabled={isLoading}
            whileHover={{ scale: 1.08, rotate: isPaused ? 0 : 2 }}
            whileTap={{ scale: 0.95 }}
            className={`w-10 h-10 rounded-2xl grid place-items-center border ${
              isPaused
                ? "border-emerald-300/40 bg-emerald-400/15"
                : "border-white/30 bg-white/10"
            } backdrop-blur-md hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60 disabled:cursor-not-allowed`}
            title={isPaused ? "Resume Streak" : "Pause Streak"}
          >
            <span className="text-white">
              {isPaused ? (
                <PlayIcon className="w-4 h-4" />
              ) : (
                <PauseIcon className="w-4 h-4" />
              )}
            </span>
          </motion.button>
        </div>

        {/* Vivid paused alert banner (magenta/purple glass, no bright yellow, no shine) */}
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 relative overflow-hidden rounded-lg border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-600/20 via-purple-600/20 to-fuchsia-600/20 text-white backdrop-blur-sm shadow-[0_8px_24px_rgba(88,28,135,0.35)]"
          >
            {/* subtle inner border glow */}
            <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-fuchsia-300/10" />
            <div className="relative flex items-center gap-2 px-3 py-2 text-xs font-extrabold uppercase tracking-wider">
              <ExclamationTriangleIcon className="w-4 h-4 text-fuchsia-200" />
              <span className="text-fuchsia-100">
                Streak Paused — counts won’t increase until you resume
              </span>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Current Streak */}
          <div className="text-center">
            <motion.div
              animate={
                !prefersReducedMotion && !isPaused && currentStreak > 0
                  ? { scale: [1, 1.03, 1] }
                  : {}
              }
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-8xl sm:text-5xl font-black drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)] bg-gradient-to-tr from-brand-gold via-brand-gold to-brand-magenta bg-clip-text text-transparent"
            >
              {currentStreak || 0}
            </motion.div>
            <p className="text-xs font-bold text-white/85">Day Streak</p>
          </div>

          {/* Best Streak */}
          <div className="text-center border-l border-white/10">
            <motion.div
              className="relative inline-block px-2 py-1"
              whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
            >
              {/* Scattering glow behind number */}
              <span className="absolute -inset-3 rounded-full bg-gradient-radial from-brand-gold/25 to-transparent blur-md" />
              {!prefersReducedMotion && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute rounded-full blur-xl opacity-60"
                      style={{
                        width: `${18 + (i % 3) * 8}px`,
                        height: `${18 + (i % 3) * 8}px`,
                        left: ["-18%", "35%", "110%", "60%", "-8%", "95%"][i],
                        top: ["-10%", "-15%", "0%", "60%", "40%", "25%"][i],
                        background:
                          i % 2 === 0
                            ? "radial-gradient(circle, rgba(214,197,43,0.55) 0%, rgba(214,197,43,0) 70%)"
                            : "radial-gradient(circle, rgba(199,87,171,0.45) 0%, rgba(199,87,171,0) 70%)",
                      }}
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{
                        scale: [0.8, 1.15, 0.9, 1],
                        opacity: [0.5, 0.9, 0.6, 0.8],
                      }}
                      transition={{
                        duration: 4 + i * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </>
              )}
              <span
                className="relative text-6xl sm:text-4xl font-black"
                style={{
                  background: "linear-gradient(180deg,#fff,#f5f3c4)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  textShadow:
                    "0 0 24px rgba(214,197,43,0.35), 0 0 8px rgba(199,87,171,0.2)",
                }}
              >
                {longestStreak || 0}
              </span>
            </motion.div>
            <p className="text-sm font-bold text-white/70 flex items-center justify-center gap-1">
              Best <TrophyIcon className="w-3 h-3" />
            </p>
          </div>
        </div>

        {!isPaused && currentStreak > 0 && (
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

        {/* Paused info row with the only Resume button (text now white) */}
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
              {/* Simplified Resume button (removed conic ring, gloss, and animated background) */}
              <motion.button
                onClick={onResume}
                disabled={isLoading}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black text-white bg-brand-emerald/80 hover:bg-brand-emerald/90 border border-emerald-300/40 shadow-glow-emerald disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <PlayIcon className="w-3.5 h-3.5" />
                Resume now
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Streak Rules */}
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
              <span>
                Miss 1 day? No problem! You get a 24-hour grace period
              </span>
            </p>
            <p className="flex items-start gap-2">
              <PauseIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Pause anytime to preserve your streak safely</span>
            </p>
            <p className="flex items-start gap-2">
              <LockClosedIcon className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-80" />
              <span className="text-xs italic opacity-75">
                Note: Missing 2+ days in a row will reset your streak
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
