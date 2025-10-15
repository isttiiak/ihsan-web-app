import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function SalatTracker() {
  const navigate = useNavigate();
  const [completedPrayers, setCompletedPrayers] = useState(() => {
    const saved = localStorage.getItem("ihsan_salat_today");
    return saved ? JSON.parse(saved) : [];
  });

  const prayers = [
    { id: "fajr", name: "Fajr", icon: "🌅", time: "Dawn" },
    { id: "dhuhr", name: "Dhuhr", icon: "☀️", time: "Noon" },
    { id: "asr", name: "Asr", icon: "🌤️", time: "Afternoon" },
    { id: "maghrib", name: "Maghrib", icon: "🌆", time: "Sunset" },
    { id: "isha", name: "Isha", icon: "🌙", time: "Night" },
  ];

  const togglePrayer = (prayerId) => {
    const newCompleted = completedPrayers.includes(prayerId)
      ? completedPrayers.filter((id) => id !== prayerId)
      : [...completedPrayers, prayerId];

    setCompletedPrayers(newCompleted);
    localStorage.setItem("ihsan_salat_today", JSON.stringify(newCompleted));
  };

  const isPrayerCompleted = (prayerId) => completedPrayers.includes(prayerId);

  // Reset at midnight
  useEffect(() => {
    const checkReset = () => {
      const lastReset = localStorage.getItem("ihsan_salat_reset");
      const today = new Date().toDateString();
      if (lastReset !== today) {
        setCompletedPrayers([]);
        localStorage.setItem("ihsan_salat_today", JSON.stringify([]));
        localStorage.setItem("ihsan_salat_reset", today);
      }
    };
    checkReset();
    const interval = setInterval(checkReset, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700">
      {/* Minimal Navbar */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="btn btn-ghost btn-sm text-white gap-2 hover:bg-white/10"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </button>
          <div className="text-white font-semibold">🕌 Ihsan</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-6xl sm:text-7xl mb-4">🕌</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Salat Tracker
          </h1>
          <p className="text-lg sm:text-xl text-white/80">
            Track your five daily prayers
          </p>
        </motion.div>

        {/* Progress Ring */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <div className="inline-block relative">
            <svg className="w-32 h-32 sm:w-40 sm:h-40" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(completedPrayers.length / 5) * 339} 339`}
                transform="rotate(-90 60 60)"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-white">
                  {completedPrayers.length}
                </div>
                <div className="text-sm text-white/80">of 5</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Prayer Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {prayers.map((prayer, index) => (
            <motion.button
              key={prayer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.95 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              onClick={() => togglePrayer(prayer.id)}
              className={`card ${
                isPrayerCompleted(prayer.id)
                  ? "bg-white text-indigo-600 shadow-2xl"
                  : "bg-white/10 text-white border-2 border-white/30"
              } shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer`}
            >
              <div className="card-body p-6 text-center">
                <div className="text-4xl mb-2">{prayer.icon}</div>
                <h3 className="text-xl font-bold mb-1">{prayer.name}</h3>
                <p className="text-sm opacity-70">{prayer.time}</p>
                {isPrayerCompleted(prayer.id) && (
                  <div className="mt-3">
                    <span className="badge badge-success gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Completed
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-white/70 text-sm space-y-1"
        >
          <p>✨ Tap any prayer to mark as completed</p>
          <p>🔄 Tap again to undo</p>
        </motion.div>

        {/* Completion Celebration */}
        <AnimatePresence>
          {completedPrayers.length === 5 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-white shadow-2xl rounded-3xl p-6 flex items-center gap-4 border-4 border-green-500">
                <div className="text-4xl">🎉</div>
                <div>
                  <h3 className="font-bold text-lg text-indigo-600">
                    Masha'Allah!
                  </h3>
                  <p className="text-sm text-gray-600">
                    All prayers completed!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
