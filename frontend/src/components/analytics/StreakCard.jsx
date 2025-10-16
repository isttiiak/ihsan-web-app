import React from "react";
import { motion } from "framer-motion";
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
} from "@heroicons/react/24/outline";

export default function StreakCard({ streak, onPause, onResume, isLoading }) {
  const { currentStreak, longestStreak, isPaused } = streak || {};

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -3 }}
      className="card bg-gradient-to-br from-amber-600 via-orange-600 to-rose-600 text-white shadow-[0_10px_40px_-10px_rgba(251,146,60,0.4)] hover:shadow-[0_15px_50px_-10px_rgba(251,146,60,0.5)] overflow-hidden relative rounded-xl"
    >
      {/* Subtle animated background glow */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-300 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 right-0 w-24 h-24 bg-rose-300 rounded-full blur-3xl"
          animate={{
            scale: [1.05, 1, 1.05],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="card-body p-3 sm:p-4 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <motion.h3
            className="text-base sm:text-lg font-extrabold flex items-center gap-2"
            animate={!isPaused ? { scale: [1, 1.01, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            {isPaused ? (
              <>
                <LockClosedIcon className="w-5 h-5 drop-shadow-lg" />
                Paused
              </>
            ) : (
              <>
                <FireIcon className="w-5 h-5 drop-shadow-lg" />
                Streak
              </>
            )}
          </motion.h3>
          <motion.button
            onClick={isPaused ? onResume : onPause}
            disabled={isLoading}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            className={`
              relative overflow-hidden rounded-full p-2
              ${
                isPaused
                  ? "bg-gradient-to-br from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400"
                  : "bg-gradient-to-br from-white/90 to-white/70 hover:from-white hover:to-white/90"
              }
              shadow-[0_4px_15px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_20px_-2px_rgba(0,0,0,0.4)]
              border-2 ${isPaused ? "border-green-600/30" : "border-white/40"}
              backdrop-blur-md
              transition-all duration-300 ease-out
              disabled:opacity-50 disabled:cursor-not-allowed
              group
            `}
            title={isPaused ? "Resume Streak" : "Pause Streak"}
          >
            <motion.div
              animate={isPaused ? { rotate: 360 } : {}}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={isPaused ? "text-white" : "text-orange-600"}
            >
              {isPaused ? (
                <PlayIcon className="w-4 h-4 drop-shadow-md" />
              ) : (
                <PauseIcon className="w-4 h-4 drop-shadow-sm" />
              )}
            </motion.div>
            {/* Hover glow effect */}
            <motion.div
              className={`absolute inset-0 rounded-full ${
                isPaused ? "bg-green-400" : "bg-white"
              } opacity-0 group-hover:opacity-30 blur-md`}
              initial={{ scale: 0 }}
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Current Streak */}
          <div className="text-center">
            <motion.div
              animate={
                !isPaused && currentStreak > 0
                  ? {
                      scale: [1, 1.03, 1],
                      textShadow: [
                        "0 0 15px rgba(255,255,255,0.5)",
                        "0 0 25px rgba(255,255,255,0.7)",
                        "0 0 15px rgba(255,255,255,0.5)",
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-4xl sm:text-5xl font-black mb-1 drop-shadow-lg"
            >
              {currentStreak || 0}
            </motion.div>
            <p className="text-xs font-bold opacity-90">Day Streak</p>
          </div>

          {/* Best Streak */}
          <div className="text-center border-l border-white/30">
            <motion.div
              className="text-3xl sm:text-4xl font-black mb-1 opacity-90 drop-shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              {longestStreak || 0}
            </motion.div>
            <p className="text-xs font-bold opacity-90 flex items-center justify-center gap-1">
              Best <TrophyIcon className="w-3 h-3" />
            </p>
          </div>
        </div>

        {!isPaused && currentStreak > 0 && (
          <motion.div
            className="p-2 bg-white/15 rounded-lg backdrop-blur-sm border border-white/25 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs text-center font-semibold opacity-95 flex items-center justify-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4" /> Keep it up! Strong habit.
            </p>
          </motion.div>
        )}

        {isPaused && (
          <motion.div
            className="p-2 bg-white/15 rounded-lg backdrop-blur-sm border border-white/25 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs text-center font-semibold opacity-95 flex items-center justify-center gap-1.5">
              <PauseIcon className="w-4 h-4" /> Safe. Resume anytime!
            </p>
          </motion.div>
        )}

        {/* Enhanced Streak Rules */}
        <motion.div
          className="p-3 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-base font-bold opacity-95 mb-2 flex items-center gap-1.5">
            <BoltIcon className="w-4 h-4" /> How Streaks Work:
          </p>
          <div className="space-y-1.5 text-sm opacity-90">
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
