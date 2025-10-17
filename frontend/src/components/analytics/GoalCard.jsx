import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircleIcon,
  FireIcon as FireIconSolid,
} from "@heroicons/react/24/solid";
import {
  PencilIcon,
  FlagIcon,
  SparklesIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

export default function GoalCard({ goal, today, onEditGoal }) {
  const { dailyTarget } = goal || { dailyTarget: 100 };
  const { total: todayTotal, goalMet } = today || { total: 0, goalMet: false };
  const prefersReducedMotion = useReducedMotion();

  const progress = Math.min((todayTotal / dailyTarget) * 100, 100);
  const remaining = Math.max(dailyTarget - todayTotal, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative overflow-hidden rounded-[1.25rem] backdrop-blur-2xl border border-white/10 bg-brand-deep/60 text-white shadow-glass"
    >
      {/* Animated confetti sparks when goal achieved */}
      {goalMet && (
        <div className="pointer-events-none absolute inset-0 z-10">
          {[...Array(18)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute block w-1.5 h-1.5 rounded-full"
              style={{
                left: `${(i * 53) % 100}%`,
                top: `${(i * 37) % 100}%`,
                background:
                  i % 3 === 0
                    ? "var(--brand-emerald)"
                    : i % 3 === 1
                    ? "var(--brand-magenta)"
                    : "var(--brand-gold)",
                boxShadow: "0 0 8px rgba(255,255,255,0.5)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={
                prefersReducedMotion
                  ? { opacity: [0, 1, 0] }
                  : {
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      y: [-6, -12, -18],
                    }
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.08,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Accent background glows */}
      <motion.div
        className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full blur-3xl bg-gradient-radial from-brand-magenta/45 to-transparent"
        animate={
          prefersReducedMotion
            ? {}
            : { scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }
        }
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 -left-20 w-80 h-80 rounded-full blur-3xl bg-gradient-radial from-brand-magenta/35 to-transparent"
        animate={prefersReducedMotion ? {} : { scale: [1.1, 1, 1.1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative z-10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 relative z-20">
            <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-white/95">
              <FlagIcon className="w-5 h-5 drop-shadow" />
              Goal
            </h3>
            {/* Simplified ACHIEVED badge beside title (no conic ring or gloss) */}
            {goalMet && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -2 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 16 }}
                className="inline-flex items-center"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-emerald-300/90 text-[var(--brand-deep)] font-black uppercase text-[10px] tracking-wider shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-white/30 ring-1 ring-inset ring-yellow-500/30">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-800" />
                  Achieved
                </span>
              </motion.div>
            )}
          </div>

          {/* Animated Edit Button */}
          <motion.button
            onClick={onEditGoal}
            whileHover={{ scale: 1.08, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-10 h-10 rounded-2xl overflow-hidden grid place-items-center border border-pink-300/30 bg-white/10 text-white"
            title="Edit Goal"
          >
            <motion.span
              className="absolute inset-[-1px] rounded-2xl bg-conic-brand"
              animate={prefersReducedMotion ? {} : { rotate: 360 }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <span className="absolute inset-[2px] rounded-[0.9rem] bg-brand-deep/90" />
            <motion.span
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/25 to-transparent"
              initial={{ x: "-120%" }}
              animate={prefersReducedMotion ? {} : { x: ["-120%", "120%"] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <span className="relative z-10">
              <PencilIcon className="w-4 h-4" />
            </span>
          </motion.button>
        </div>

        {/* Progress Circle */}
        <div className="flex flex-col items-center justify-center mb-3">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32">
            <svg
              className="w-full h-full transform -rotate-90 drop-shadow-xl"
              viewBox="0 0 120 120"
            >
              <defs>
                <linearGradient
                  id="progressGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="var(--brand-emerald)" />
                  <stop offset="30%" stopColor="var(--brand-gold)" />
                  <stop offset="60%" stopColor="var(--brand-magenta)" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/15"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 50 * (1 - progress / 100),
                }}
                transition={{ duration: 1.3, ease: "easeOut" }}
                style={{ filter: "drop-shadow(0 0 10px rgba(199,87,171,0.6))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <motion.div
                className="text-4xl sm:text-5xl font-black leading-none"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              >
                {todayTotal}
              </motion.div>
              <div className="text-xs font-semibold text-white/80 mt-0.5">
                / {dailyTarget}
              </div>
            </div>
          </div>
          <motion.div
            className="mt-2 text-3xl font-black tracking-tight text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {progress.toFixed(0)}%
          </motion.div>
        </div>

        {/* Status */}
        {goalMet ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative p-2 bg-gradient-to-r from-emerald-500/30 via-yellow-400/30 to-pink-500/30 rounded-lg backdrop-blur-sm border border-white/20 flex items-center justify-center gap-2 overflow-hidden"
          >
            {/* Shine sweep */}
            {!prefersReducedMotion && (
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                initial={{ x: "-120%" }}
                animate={{ x: ["-120%", "120%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
              />
            )}
            <TrophyIcon className="w-5 h-5" />
            <span className="text-sm font-extrabold tracking-wide">
              Congratulations! Goal Achieved
            </span>
          </motion.div>
        ) : (
          <motion.div
            className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/15"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <p className="text-sm font-semibold text-white/90 flex items-center justify-center gap-1.5">
              <span className="font-black text-xl">{remaining}</span>{" "}
              <span>more to reach goal</span>
            </p>
          </motion.div>
        )}

        {/* Target info */}
        <div className="mt-2 text-center text-md font-semibold text-white/70 flex items-center justify-center gap-1">
          <SparklesIcon className="w-3 h-3" /> Target: {dailyTarget} zikr/day
        </div>
      </div>
    </motion.div>
  );
}
