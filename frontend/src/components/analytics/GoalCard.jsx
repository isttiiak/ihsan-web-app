import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  FireIcon as FireIconSolid,
} from "@heroicons/react/24/solid";
import {
  PencilIcon,
  FlagIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function GoalCard({ goal, today, onEditGoal }) {
  const { dailyTarget } = goal || { dailyTarget: 100 };
  const { total: todayTotal, goalMet } = today || { total: 0, goalMet: false };

  const progress = Math.min((todayTotal / dailyTarget) * 100, 100);
  const remaining = Math.max(dailyTarget - todayTotal, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -3 }}
      className="card bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-[0_10px_40px_-10px_rgba(139,92,246,0.4)] hover:shadow-[0_15px_50px_-10px_rgba(139,92,246,0.5)] overflow-hidden relative rounded-xl"
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 bg-pink-300 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 3.5, repeat: Infinity }}
        />
      </div>

      <div className="card-body p-3 sm:p-4 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 opacity-95">
            <FlagIcon className="w-5 h-5 drop-shadow-lg" />
            Goal
          </h3>
          <motion.button
            onClick={onEditGoal}
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="btn btn-xs btn-circle bg-white/50 hover:bg-white/80 border-2 border-white/70 text-white shadow-lg hover:shadow-xl backdrop-blur-sm font-bold"
            title="Edit Goal"
          >
            <PencilIcon className="w-3 h-3" />
          </motion.button>
        </div>

        {/* Compact Progress Circle */}
        <div className="flex flex-col items-center justify-center mb-2">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32">
            <svg
              className="w-full h-full transform -rotate-90 drop-shadow-xl"
              viewBox="0 0 120 120"
            >
              <defs>
                {/* Gradient for progress arc */}
                <linearGradient
                  id="progressGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="30%" stopColor="#f59e0b" />
                  <stop offset="60%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>

              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/20"
              />
              {/* Progress circle with gradient */}
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
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                  filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))",
                }}
              />
            </svg>

            {/* Center text - Perfectly aligned */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <motion.div
                className="text-4xl sm:text-5xl font-black leading-none"
                whileHover={{ scale: 1.05 }}
              >
                {todayTotal}
              </motion.div>
              <div className="text-xs font-semibold opacity-75 mt-0.5">
                / {dailyTarget}
              </div>
            </div>
          </div>

          {/* Percentage below circle - Bold and prominent */}
          <motion.div
            className="mt-2 text-3xl font-black tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {progress.toFixed(0)}%
          </motion.div>
        </div>

        {/* Status - Compact */}
        {goalMet ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-2 bg-white/15 rounded-lg backdrop-blur-sm border border-white/25 flex items-center justify-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span className="text-sm font-bold opacity-95">Goal Achieved!</span>
          </motion.div>
        ) : (
          <motion.div
            className="text-center p-2 bg-white/15 rounded-lg backdrop-blur-sm border border-white/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm font-semibold opacity-95 flex items-center justify-center gap-1.5">
              <span className="font-black text-xl">{remaining}</span>{" "}
              <span>more to reach goal</span>
            </p>
          </motion.div>
        )}

        {/* Target info - Subtle */}
        <div className="mt-2 text-center text-md font-semibold opacity-70 flex items-center justify-center gap-1">
          <SparklesIcon className="w-3 h-3" />
          Target: {dailyTarget} zikr/day
        </div>
      </div>
    </motion.div>
  );
}
