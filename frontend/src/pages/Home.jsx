import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useZikrStore } from "../store/useZikrStore";
import AnimatedBackground from "../components/AnimatedBackground";

// Helpers
const getLocalDate = (d = new Date()) => {
  // YYYY-MM-DD in local time, avoids UTC issues
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const isYesterday = (dateStr) => {
  const today = new Date();
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  return getLocalDate(y) === dateStr;
};

export default function Home() {
  const { user } = useAuthStore();
  const { counts = {}, hydrate } = useZikrStore();
  const location = useLocation();

  // Sync today counts on mount, route change, tab focus, and visibility change
  useEffect(() => {
    const doHydrate = () => hydrate?.();
    doHydrate();
    window.addEventListener("focus", doHydrate);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) doHydrate();
    });
    return () => {
      window.removeEventListener("focus", doHydrate);
      document.removeEventListener("visibilitychange", doHydrate);
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  // Daily Goal (local only UI setting)
  const [goal, setGoal] = useState(() => {
    const v = parseInt(localStorage.getItem("ihsan_daily_goal") || "100", 10);
    return Number.isFinite(v) && v > 0 ? v : 100;
  });
  const [editOpen, setEditOpen] = useState(false);
  const [draftGoal, setDraftGoal] = useState(goal);

  // Simple local streak tracker
  const [streak, setStreak] = useState(() => {
    const raw = localStorage.getItem("ihsan_zikr_streak");
    try {
      return raw ? JSON.parse(raw) : { count: 0, lastActive: null };
    } catch {
      return { count: 0, lastActive: null };
    }
  });

  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  

  // ------------- prev-----------
  // Fetch analytics on mount and after any zikr increment
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        const idToken = localStorage.getItem("ihsan_idToken");
        if (!idToken) return;
        const timezoneOffset = new Date().getTimezoneOffset();
        const res = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/analytics/analytics?days=1&timezoneOffset=${timezoneOffset}`,
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error("Error fetching analytics for Home:", err);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, [counts]); // re-fetch when counts change (i.e., after increment)

  // --------------end prev------------

  // ---------my code------------

  // const fetchAnalytics = async () => {
  //     try {
  //       const idToken = localStorage.getItem("ihsan_idToken");
  //       if (!idToken) return;
  
  //       // Get user's timezone offset (auto-detected)
  //       const timezoneOffset = getUserTimezoneOffset();
  
  //       const res = await fetch(
  //         `${
  //           import.meta.env.VITE_BACKEND_URL
  //         }/api/analytics/analytics?days=${selectedPeriod}&timezoneOffset=${timezoneOffset}`,
  //         { headers: { Authorization: `Bearer ${idToken}` } }
  //       );
  
  //       if (res.ok) {
  //         const data = await res.json();
  //         setAnalyticsData(data);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching analytics:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  // --------- end my code----------

  // ----------- prev -----------
  // Use analytics values for Zikr card only
  const totalToday = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );
  const analyticsGoal = analyticsData?.goal?.dailyTarget ?? null;
  const streakCount = analyticsData?.streak?.count ?? null;
  const goalCompleted =
    totalToday !== null && analyticsGoal !== null
      ? totalToday >= analyticsGoal
      : false;

  // ----------- end prev ---------

  


  // ------------- my code --------------

  // const { chartData, stats, today, hgoal, Hhstreak, allTime } = analyticsData;

  // // ----------- end my code ------------

  const activities = [
    {
      id: "zikr",
      icon: "📿",
      title: "Zikr Counter",
      description: "Continue your remembrance of Allah",
      stats: { label: "Today", value: totalToday },
      action: "Start Counting",
      link: "/zikr",
      accentColor: "var(--brand-emerald, #2A9B7D)",
      iconBg: "bg-gradient-to-br from-brand-emerald/20 to-emerald-400/30",
      tag: "Developing",
      streakCount,
      goalCompleted,
    },
    {
      id: "salat",
      icon: "🕌",
      title: "Salat Tracker",
      description: "Track your daily prayers",
      stats: { label: "Today", value: "0/5" },
      action: "Track Prayer",
      link: "/salat",
      accentColor: "var(--brand-emerald, #2A9B7D)",
      iconBg: "bg-gradient-to-br from-indigo-500/20 to-purple-500/30",
      tag: "Coming Soon…",
    },
    {
      id: "fasting",
      icon: "🌙",
      title: "Fasting Tracker",
      description: "Monitor your fasting journey",
      stats: { label: "Streak", value: `${streak.count} days` },
      action: "Log Fast",
      link: "/fasting",
      accentColor: "var(--brand-magenta, #C757AB)",
      iconBg: "bg-gradient-to-br from-brand-magenta/20 to-pink-500/30",
      tag: "Coming Soon…",
    },
    {
      id: "prayer-times",
      icon: "⏰",
      title: "Prayer Times",
      description: "Never miss a prayer",
      stats: { label: "Next Prayer", value: "Fajr" },
      action: "View Times",
      link: "/prayer-times",
      accentColor: "var(--brand-gold, #D6C52B)",
      iconBg: "bg-gradient-to-br from-brand-gold/20 to-amber-500/30",
      tag: "Coming Soon…",
    },
  ];

  return (
    <AnimatedBackground variant="premium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Activities - moved to the top since hero is removed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
          {activities.map((a, i) => {
            const isZikr = a.id === "zikr";
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link to={a.link} className="block h-full group">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative h-full rounded-3xl overflow-hidden backdrop-blur-2xl border border-white/10 bg-white/5"
                  >
                    {/* Tag in top left */}
                    <span
                      className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white/80 shadow-lg backdrop-blur-md border border-white/10"
                      style={{
                        letterSpacing: "0.04em",
                        background:
                          a.tag === "Developing"
                            ? "linear-gradient(90deg, #2A9B7D 0%, #C757AB 100%)"
                            : "linear-gradient(90deg, #D6C52B 0%, #C757AB 100%)",
                      }}
                    >
                      {a.tag}
                    </span>
                    {/* Zikr card: streak and goal icons side by side in top right */}
                    {isZikr && (
                      <div className="absolute top-4 right-4 z-20 flex flex-row items-center gap-3">
                        {/* Streak Icon */}
                        <button
                          title={`Current streak: ${a.streakCount ?? "-"} days`}
                          className="px-2 py-1 rounded-full flex items-center gap-1 font-bold shadow-lg border border-white/10 backdrop-blur-md bg-gradient-to-br from-emerald-600/60 via-pink-400/30 to-yellow-300/40 hover:scale-105 transition-transform"
                          style={{
                            boxShadow:
                              "0 2px 16px 0 rgba(42,155,125,0.18), 0 1.5px 8px 0 #C757AB44",
                            border: "1.5px solid rgba(255,255,255,0.18)",
                          }}
                          disabled={loadingAnalytics}
                        >
                          <span
                            className="text-lg"
                            role="img"
                            aria-label="streak"
                          >
                            🔥
                          </span>
                          <span className="text-xs text-white/90 font-bold">
                            {a.streakCount !== null ? (
                              a.streakCount
                            ) : (
                              <span className="loading loading-spinner loading-xs" />
                            )}
                          </span>
                        </button>
                        {/* Goal Badge Icon - calculate from todayTotal and analyticsGoal */}
                        <button
                          title={
                            a.goalCompleted
                              ? "Goal Achieved!"
                              : "Goal Incomplete"
                          }
                          className={`px-2 py-1 rounded-full flex items-center gap-1 font-bold shadow-lg border border-white/10 backdrop-blur-md bg-gradient-to-br from-yellow-300/60 via-pink-400/30 to-emerald-400/40 hover:scale-105 transition-transform ${
                            a.goalCompleted ? "" : "opacity-70"
                          }`}
                          style={{
                            boxShadow:
                              "0 2px 16px 0 rgba(214,197,43,0.18), 0 1.5px 8px 0 #C757AB44",
                            border: "1.5px solid rgba(255,255,255,0.18)",
                          }}
                          disabled={loadingAnalytics}
                        >
                          <span
                            className="text-lg"
                            role="img"
                            aria-label="goal"
                          >
                            {a.goalCompleted ? "🏆" : "⭕"}
                          </span>
                        </button>
                      </div>
                    )}
                    <div className="relative z-10 p-6 sm:p-8">
                      <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 ${a.iconBg} rounded-2xl grid place-items-center border border-white/10 mb-5`}
                      >
                        <span className="text-4xl sm:text-5xl">{a.icon}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                        {a.title}
                      </h2>
                      <p className="text-white/70 text-sm sm:text-base mb-6">
                        {a.description}
                      </p>
                      <div
                        className="rounded-2xl p-4 text-center text-white"
                        style={{
                          background: `linear-gradient(135deg, ${a.accentColor}90, ${a.accentColor}70)`,
                        }}
                      >
                        <div className="text-3xl sm:text-4xl font-black">
                          {a.stats.value}
                        </div>
                        <div className="text-xs sm:text-sm opacity-90 font-semibold mt-1 uppercase">
                          {a.stats.label}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-5 w-full py-3 rounded-xl text-white font-bold relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${a.accentColor}, ${a.accentColor}cc)`,
                        }}
                      >
                        <span className="relative z-10">{a.action}</span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.6 }}
                        />
                      </motion.button>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Subtle premium footer note */}
        <div className="text-center text-xs text-white/50">
          May your remembrance be constant.
        </div>

        {/* Edit Goal Modal */}
        {editOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditOpen(false)}
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-brand-deep/90 to-black/70 p-6">
              <div className="text-lg font-bold text-white mb-3">
                Edit Daily Goal
              </div>
              <div className="text-sm text-white/70 mb-4">
                Set your target count for today.
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={draftGoal}
                  onChange={(e) =>
                    setDraftGoal(
                      Math.max(1, parseInt(e.target.value || "1", 10))
                    )
                  }
                  className="input input-bordered w-full bg-white/10 text-white placeholder-white/50"
                  placeholder="Enter goal"
                />
                <button
                  onClick={() => {
                    setGoal(draftGoal);
                    setEditOpen(false);
                  }}
                  className="btn btn-primary bg-brand-magenta border-brand-magenta hover:bg-brand-magenta/90 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedBackground>
  );
}
