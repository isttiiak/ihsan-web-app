import React from "react";
import { motion } from "framer-motion";
import { FireIcon } from "@heroicons/react/24/solid";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/outline";

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
            className="text-sm sm:text-base font-extrabold flex items-center gap-1.5"
            animate={!isPaused ? { scale: [1, 1.01, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <FireIcon className="w-4 h-4 drop-shadow-lg" />
            {isPaused ? "🔒 Paused" : "🔥 Streak"}
          </motion.h3>
          <motion.button
            onClick={isPaused ? onResume : onPause}
            disabled={isLoading}
            whileHover={{ scale: 1.1, rotate: isPaused ? 360 : 180 }}
            whileTap={{ scale: 0.9 }}
            className="btn btn-xs btn-circle bg-white/50 hover:bg-white/80 border-2 border-white/70 shadow-lg hover:shadow-xl text-white backdrop-blur-sm font-bold transition-all duration-300"
            title={isPaused ? "Resume Streak" : "Pause Streak"}
          >
            {isPaused ? (
              <PlayIcon className="w-3 h-3" />
            ) : (
              <PauseIcon className="w-3 h-3" />
            )}
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Current Streak */}
          <div className="text-center">
            <motion.div
              className="text-3xl sm:text-4xl font-black mb-0.5 drop-shadow-lg"
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
            >
              {currentStreak || 0}
            </motion.div>
            <p className="text-[10px] font-bold opacity-90">Day Streak</p>
          </div>

          {/* Best Streak */}
          <div className="text-center border-l border-white/30">
            <motion.div
              className="text-2xl sm:text-3xl font-black mb-0.5 opacity-90 drop-shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              {longestStreak || 0}
            </motion.div>
            <p className="text-[10px] font-bold opacity-90">Best 🏅</p>
          </div>
        </div>

        {!isPaused && currentStreak > 0 && (
          <motion.div
            className="p-2 bg-white/15 rounded-lg backdrop-blur-sm border border-white/25 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[10px] text-center font-semibold opacity-95">
              🎯 Keep it up! Strong habit.
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
            <p className="text-[10px] text-center font-semibold opacity-95">
              ⏸️ Safe. Resume anytime!
            </p>
          </motion.div>
        )}

        {/* Compact Streak Rules */}
        <motion.div
          className="p-2 bg-white/10 rounded-lg border border-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-[9px] font-bold opacity-90 mb-0.5">📋 Rules:</p>
          <p className="text-[9px] opacity-85">
            • 1 zikr daily • 24h grace • Pause anytime
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
