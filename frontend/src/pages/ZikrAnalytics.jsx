import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnimatedBackground from "../components/AnimatedBackground";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ArrowLeftIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import StreakCard from "../components/analytics/StreakCard";
import GoalCard from "../components/analytics/GoalCard";
import TrendChart from "../components/analytics/TrendChart";
import { getUserTimezoneOffset } from "../utils/timezone";

export default function ZikrAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [activeTab, setActiveTab] = useState("today"); // "today" or "all"
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState(70);
  const [updating, setUpdating] = useState(false);

  const periods = [
    { label: "7 Days", value: 7 },
    { label: "15 Days", value: 15 },
    { label: "30 Days", value: 30 },
    { label: "60 Days", value: 60 },
    { label: "90 Days", value: 90 },
    { label: "180 Days", value: 180 },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  // Smart detection: Check for day change when user focuses the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh analytics
        fetchAnalytics();
      }
    };

    const handleFocus = () => {
      // Window gained focus, refresh analytics
      fetchAnalytics();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      const idToken = localStorage.getItem("ihsan_idToken");
      if (!idToken) return;

      // Get user's timezone offset (auto-detected)
      const timezoneOffset = getUserTimezoneOffset();

      const res = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/analytics/analytics?days=${selectedPeriod}&timezoneOffset=${timezoneOffset}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseStreak = async () => {
    setUpdating(true);
    try {
      const idToken = localStorage.getItem("ihsan_idToken");
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/analytics/streak/pause`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      if (res.ok) {
        await fetchAnalytics();
      }
    } catch (err) {
      console.error("Error pausing streak:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleResumeStreak = async () => {
    setUpdating(true);
    try {
      const idToken = localStorage.getItem("ihsan_idToken");
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/analytics/streak/resume`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      if (res.ok) {
        await fetchAnalytics();
      }
    } catch (err) {
      console.error("Error resuming streak:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!newGoal || newGoal < 1) return;

    setUpdating(true);
    try {
      const idToken = localStorage.getItem("ihsan_idToken");
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/analytics/goal`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dailyTarget: parseInt(newGoal) }),
        }
      );

      if (res.ok) {
        await fetchAnalytics();
        setShowGoalModal(false);
      }
    } catch (err) {
      console.error("Error updating goal:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-emerald-400" />
          <p className="text-sm bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-semibold">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg text-slate-400 font-medium">
            No analytics data available
          </p>
        </div>
      </div>
    );
  }

  const { chartData, stats, today, goal, streak, allTime } = analyticsData;

  // Get today's data from backend (not local store to avoid reset issues)
  const todayTypes = today?.perType || [];
  const todayTotal = today?.total || 0;

  // Fetch all-time per-type data from backend
  const allTimeTypes = analyticsData.perType || [];

  // Get data based on active tab for breakdown
  const displayData = activeTab === "today" ? todayTypes : allTimeTypes;
  const displayTotal =
    activeTab === "today" ? todayTotal : allTime?.totalCount || 0;

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8 relative">
        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          {/* Compact Top Navigation - Only show on mobile or when needed */}
          <div className="flex items-center justify-end lg:hidden">
            <motion.button
              onClick={() => navigate("/zikr")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-sm bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-lg gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </motion.button>
          </div>

          {/* Streak and Goal Cards - Redesigned with Harmonious Colors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StreakCard
              streak={streak}
              onPause={handlePauseStreak}
              onResume={handleResumeStreak}
              isLoading={updating}
            />
            <GoalCard
              goal={goal}
              today={today}
              onEditGoal={() => {
                setNewGoal(goal.dailyTarget);
                setShowGoalModal(true);
              }}
            />
          </div>

          {/* Overview Statistics Section */}
          <div className="space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3"
            >
              <ChartBarIcon className="w-8 h-8 text-emerald-400" />
              Overview Statistics
            </motion.h2>

            {/* Stats Cards - Grid with Total Zikr Count as first card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Zikr Count - FEATURED CARD */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ delay: 0.05 }}
                className="sm:col-span-2 lg:col-span-1 card relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-emerald via-teal-600 to-cyan-600 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(42,155,125,0.4)] hover:shadow-[0_12px_48px_rgba(42,155,125,0.6)] cursor-pointer group"
              >
                {/* Animated gradient orbs */}
                <div className="absolute inset-0 opacity-40">
                  <motion.div
                    className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.4, 0.6, 0.4],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                </div>

                <div className="card-body p-5 sm:p-6 relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <FireIcon className="w-6 h-6 text-white drop-shadow-lg" />
                    </motion.div>
                    <h3 className="text-sm font-bold text-white/90 uppercase tracking-wide">
                      Total Zikr
                    </h3>
                  </div>
                  <div className="text-5xl sm:text-6xl font-black text-white mb-2 drop-shadow-2xl">
                    {allTime?.totalCount?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-white/80 font-medium">
                    ✨ All-time remembrance
                  </p>
                </div>

                {/* Shine effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
              </motion.div>

              {/* Today's Count */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ delay: 0.1 }}
                className="card backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg hover:shadow-[0_8px_32px_rgba(199,87,171,0.3)] cursor-pointer"
              >
                <div className="card-body p-5 sm:p-6">
                  <div className="text-xs sm:text-sm font-bold mb-2 bg-gradient-to-r from-brand-gold to-amber-400 bg-clip-text text-transparent uppercase tracking-wide">
                    📅 Today
                  </div>
                  <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-amber-300 to-orange-300 bg-clip-text text-transparent">
                    {todayTotal.toLocaleString()}
                  </div>
                </div>
              </motion.div>

              {/* All-Time Best Day */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ delay: 0.15 }}
                className="card backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg hover:shadow-[0_8px_32px_rgba(42,155,125,0.3)] cursor-pointer"
              >
                <div className="card-body p-5 sm:p-6">
                  <div className="text-xs sm:text-sm font-bold mb-2 bg-gradient-to-r from-brand-emerald to-emerald-400 bg-clip-text text-transparent uppercase tracking-wide">
                    🏆 Best
                  </div>
                  <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-green-300 to-emerald-300 bg-clip-text text-transparent">
                    {allTime?.bestDay?.count?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-slate-400 mt-2 font-medium">
                    {allTime?.bestDay?.date
                      ? new Date(allTime.bestDay.date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </div>
                </div>
              </motion.div>

              {/* Types Done */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ delay: 0.2 }}
                className="card backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg hover:shadow-[0_8px_32px_rgba(199,87,171,0.3)] cursor-pointer"
              >
                <div className="card-body p-5 sm:p-6">
                  <div className="text-xs sm:text-sm font-bold mb-2 bg-gradient-to-r from-brand-magenta to-rose-400 bg-clip-text text-transparent uppercase tracking-wide">
                    🎯 Types
                  </div>
                  <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-pink-300 to-rose-300 bg-clip-text text-transparent">
                    {allTimeTypes.filter((t) => t.total > 0).length}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Breakdown by Type Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent flex items-center gap-3">
                  <ChartBarIcon className="w-8 h-8 text-purple-400" />
                  Breakdown by Type
                </h2>
              </div>

              {/* Today/All Tabs - Glassmorphism */}
              <div className="tabs tabs-boxed bg-slate-800/50 backdrop-blur-xl border border-white/10 shadow-lg">
                <button
                  className={`tab ${
                    activeTab === "today"
                      ? "tab-active bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold"
                      : "text-slate-300 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("today")}
                >
                  📅 Today
                </button>
                <button
                  className={`tab ${
                    activeTab === "all"
                      ? "tab-active bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold"
                      : "text-slate-300 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("all")}
                >
                  ✨ All Time
                </button>
              </div>
            </div>

            {displayData?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayData.map((t, index) => {
                  const gradients = [
                    "from-cyan-600 via-blue-600 to-indigo-600",
                    "from-violet-600 via-purple-600 to-fuchsia-600",
                    "from-rose-600 via-pink-600 to-red-600",
                    "from-amber-600 via-orange-600 to-red-600",
                    "from-emerald-600 via-teal-600 to-cyan-600",
                    "from-indigo-600 via-blue-600 to-cyan-600",
                  ];
                  const gradient = gradients[index % gradients.length];

                  return (
                    <motion.div
                      key={t.zikrType}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -8, scale: 1.03 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className={`card relative overflow-hidden bg-gradient-to-br ${gradient} backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_48px_rgba(42,155,125,0.4)] cursor-pointer rounded-2xl group`}
                    >
                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />

                      <div className="card-body p-6 relative z-10">
                        <h3 className="font-black text-xl sm:text-2xl truncate text-white drop-shadow-lg">
                          {t.zikrType}
                        </h3>
                        <div className="text-5xl sm:text-6xl font-black text-white drop-shadow-2xl my-2">
                          {t.total.toLocaleString()}
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="mt-4">
                          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(t.total / displayTotal) * 100}%`,
                              }}
                              transition={{
                                delay: 0.2 + index * 0.05,
                                duration: 0.8,
                              }}
                              className="h-full bg-white rounded-full shadow-lg"
                            />
                          </div>
                          <p className="text-sm font-bold text-white/90 mt-2 drop-shadow-md">
                            {((t.total / displayTotal) * 100).toFixed(1)}% of
                            {activeTab === "today" ? " today" : " total"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="card bg-slate-800/50 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl">
                <div className="card-body text-center p-12">
                  <p className="text-slate-400 text-lg font-medium">
                    No zikr recorded yet for{" "}
                    {activeTab === "today" ? "today" : "all time"}.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Trends & Insights Section */}
          <div className="space-y-6 mt-12 pt-8 border-t-2 border-slate-700/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
                <ChartBarIcon className="w-8 h-8 text-blue-400" />
                Trends & Insights
              </h2>

              {/* Period Selector - Glassmorphism */}
              <div className="tabs tabs-boxed bg-slate-800/50 backdrop-blur-xl border border-white/10 shadow-lg">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    className={`tab ${
                      selectedPeriod === period.value
                        ? "tab-active bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold"
                        : "text-slate-300 hover:text-white"
                    }`}
                    onClick={() => setSelectedPeriod(period.value)}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trend Chart */}
            <TrendChart data={chartData} period={selectedPeriod} />
          </div>
        </div>

        {/* Goal Edit Modal - Dark Glassmorphism */}
        {showGoalModal && (
          <div className="modal modal-open">
            <motion.div
              className="modal-box bg-slate-800/90 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="font-black text-2xl mb-6 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Set Daily Goal
              </h3>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-slate-300 font-semibold">
                    Daily Target (zikr count)
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="input input-bordered bg-slate-700/50 text-white border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 backdrop-blur-sm"
                  placeholder="Enter your daily goal"
                />
              </div>
              <div className="modal-action">
                <button
                  className="btn bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border-slate-600 backdrop-blur-sm"
                  onClick={() => setShowGoalModal(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  className="btn bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-none shadow-lg font-bold"
                  onClick={handleUpdateGoal}
                  disabled={updating || !newGoal || newGoal < 1}
                >
                  {updating ? "Updating..." : "Save Goal"}
                </button>
              </div>
            </motion.div>
            <div
              className="modal-backdrop bg-black/60 backdrop-blur-sm"
              onClick={() => setShowGoalModal(false)}
            />
          </div>
        )}
      </div>
    </AnimatedBackground>
  );
}
