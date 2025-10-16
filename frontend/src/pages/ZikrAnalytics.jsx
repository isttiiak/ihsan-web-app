import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ArrowLeftIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useZikrStore } from "../store/useZikrStore";
import StreakCard from "../components/analytics/StreakCard";
import GoalCard from "../components/analytics/GoalCard";
import TrendChart from "../components/analytics/TrendChart";

export default function ZikrAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [activeTab, setActiveTab] = useState("all"); // "today" or "all"
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState(100);
  const [updating, setUpdating] = useState(false);

  // Get today's counts from local store
  const { counts: todayCounts } = useZikrStore();

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

  const fetchAnalytics = async () => {
    try {
      const idToken = localStorage.getItem("ihsan_idToken");
      if (!idToken) return;

      const res = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/analytics/analytics?days=${selectedPeriod}`,
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
      <div className="min-h-screen bg-gradient-to-br from-ihsan-light via-base-100 to-ihsan-light/50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-ihsan-primary" />
          <p className="text-sm opacity-70">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ihsan-light via-base-100 to-ihsan-light/50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg opacity-70">No analytics data available</p>
        </div>
      </div>
    );
  }

  const { chartData, stats, today, goal, streak, allTime } = analyticsData;

  // Calculate today's data
  const todayTypes = Object.entries(todayCounts)
    .map(([zikrType, count]) => ({
      zikrType,
      total: count,
    }))
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total);

  const todayTotal = todayTypes.reduce((sum, t) => sum + t.total, 0);

  // Fetch all-time per-type data from backend
  const allTimeTypes = analyticsData.perType || [];

  // Get data based on active tab for breakdown
  const displayData = activeTab === "today" ? todayTypes : allTimeTypes;
  const displayTotal =
    activeTab === "today" ? todayTotal : allTime?.totalCount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => navigate("/zikr")}
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            className="btn bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white border-none shadow-lg hover:shadow-xl gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Zikr Counter
          </motion.button>
        </div>

        {/* Header with Global Counter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">
            📊 Zikr Analytics
          </h1>

          {/* Global Zikr Counter - Smaller, More Refined */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="inline-block w-full max-w-md"
          >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 text-white shadow-[0_10px_40px_-10px_rgba(20,184,166,0.4)] hover:shadow-[0_15px_50px_-10px_rgba(20,184,166,0.5)] transition-all">
              {/* Subtle animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <motion.div
                  className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </div>

              <div className="relative card-body p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <FireIcon className="w-4 h-4 opacity-90" />
                  </motion.div>
                  <h2 className="text-xs font-semibold opacity-90">
                    Total Zikr Count
                  </h2>
                </div>
                <div className="text-4xl sm:text-5xl font-black tracking-tight my-0.5">
                  {allTime?.totalCount?.toLocaleString() || 0}
                </div>
                <p className="text-[10px] opacity-75">
                  All-time remembrance ☪️
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

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
        <div className="space-y-5">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 5 }}
            className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3"
          >
            <ChartBarIcon className="w-8 h-8 text-teal-400" />
            Overview Statistics
          </motion.h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* All-Time Total */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ delay: 0.1 }}
              className="card bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-[0_10px_40px_-10px_rgba(79,70,229,0.6)] hover:shadow-[0_15px_50px_-10px_rgba(79,70,229,0.8)] cursor-pointer"
            >
              <div className="card-body p-4 sm:p-5">
                <div className="text-xs sm:text-sm font-bold mb-2 opacity-95">
                  📊 All-Time
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold">
                  {allTime?.totalCount?.toLocaleString() || 0}
                </div>
              </div>
            </motion.div>

            {/* Today's Count */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ delay: 0.15 }}
              className="card bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-[0_10px_40px_-10px_rgba(245,158,11,0.6)] hover:shadow-[0_15px_50px_-10px_rgba(245,158,11,0.8)] cursor-pointer"
            >
              <div className="card-body p-4 sm:p-5">
                <div className="text-xs sm:text-sm font-bold mb-2 opacity-95">
                  📅 Today
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold">
                  {todayTotal.toLocaleString()}
                </div>
              </div>
            </motion.div>

            {/* All-Time Best Day */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ delay: 0.2 }}
              className="card bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)] hover:shadow-[0_15px_50px_-10px_rgba(16,185,129,0.8)] cursor-pointer"
            >
              <div className="card-body p-4 sm:p-5">
                <div className="text-xs sm:text-sm font-bold mb-2 opacity-95">
                  🏆 Best
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold">
                  {allTime?.bestDay?.count?.toLocaleString() || 0}
                </div>
                <div className="text-xs opacity-90 mt-1">
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
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ delay: 0.25 }}
              className="card bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white shadow-[0_10px_40px_-10px_rgba(192,38,211,0.6)] hover:shadow-[0_15px_50px_-10px_rgba(192,38,211,0.8)] cursor-pointer"
            >
              <div className="card-body p-4 sm:p-5">
                <div className="text-xs sm:text-sm font-bold mb-2 opacity-95">
                  🎯 Types
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold">
                  {allTimeTypes.filter((t) => t.total > 0).length}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Breakdown by Type Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="w-6 h-6 text-ihsan-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-ihsan-primary">
                Breakdown by Type
              </h2>
            </div>

            {/* Today/All Tabs */}
            <div className="tabs tabs-boxed bg-base-200">
              <button
                className={`tab ${
                  activeTab === "today"
                    ? "tab-active bg-gradient-teal text-white"
                    : ""
                }`}
                onClick={() => setActiveTab("today")}
              >
                📅 Today
              </button>
              <button
                className={`tab ${
                  activeTab === "all"
                    ? "tab-active bg-gradient-teal text-white"
                    : ""
                }`}
                onClick={() => setActiveTab("all")}
              >
                🕊️ All Time
              </button>
            </div>
          </div>

          {displayData?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayData.map((t, index) => {
                const gradients = [
                  "from-cyan-600 to-blue-600",
                  "from-violet-600 to-purple-600",
                  "from-rose-600 to-pink-600",
                  "from-amber-600 to-orange-600",
                  "from-emerald-600 to-teal-600",
                  "from-indigo-600 to-blue-600",
                ];
                const gradient = gradients[index % gradients.length];

                return (
                  <motion.div
                    key={t.zikrType}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`card bg-gradient-to-br ${gradient} text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(0,0,0,0.6)] cursor-pointer`}
                  >
                    <div className="card-body p-5 sm:p-6">
                      <h3 className="font-bold text-lg sm:text-xl truncate opacity-95">
                        {t.zikrType}
                      </h3>
                      <div className="text-4xl sm:text-5xl font-extrabold">
                        {t.total.toLocaleString()}
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm">
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
                        <p className="text-xs font-semibold opacity-90 mt-2">
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
            <div className="card bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-xl">
              <div className="card-body text-center p-8">
                <p className="text-gray-400 text-lg">
                  No zikr recorded yet for{" "}
                  {activeTab === "today" ? "today" : "all time"}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Trends & Insights Section */}
        <div className="space-y-5 mt-12 pt-8 border-t-2 border-slate-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
              <ChartBarIcon className="w-8 h-8 text-teal-400" />
              Trends & Insights
            </h2>

            {/* Period Selector */}
            <div className="tabs tabs-boxed bg-slate-800 border border-slate-700">
              {periods.map((period) => (
                <button
                  key={period.value}
                  className={`tab ${
                    selectedPeriod === period.value
                      ? "tab-active bg-gradient-to-r from-teal-600 to-cyan-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  onClick={() => setSelectedPeriod(period.value)}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Period-Based Stats Cards - Above Chart */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Period Total */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ delay: 0.1 }}
              className="card bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_10px_40px_-10px_rgba(59,130,246,0.6)] cursor-pointer"
            >
              <div className="card-body p-4 text-center">
                <div className="text-xs font-semibold mb-2 opacity-90">
                  Period Total
                </div>
                <div className="text-3xl font-extrabold">
                  {stats?.total?.toLocaleString() || 0}
                </div>
              </div>
            </motion.div>

            {/* Daily Average */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ delay: 0.15 }}
              className="card bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-[0_10px_40px_-10px_rgba(139,92,246,0.6)] cursor-pointer"
            >
              <div className="card-body p-4 text-center">
                <div className="text-xs font-semibold mb-2 opacity-90">
                  Daily Average
                </div>
                <div className="text-3xl font-extrabold">
                  {stats?.average?.toLocaleString() || 0}
                </div>
              </div>
            </motion.div>

            {/* Best Day in Period */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ delay: 0.2 }}
              className="card bg-gradient-to-br from-pink-600 to-rose-600 text-white shadow-[0_10px_40px_-10px_rgba(236,72,153,0.6)] cursor-pointer"
            >
              <div className="card-body p-4 text-center">
                <div className="text-xs font-semibold mb-2 opacity-90">
                  Best Day
                </div>
                <div className="text-3xl font-extrabold">
                  {stats?.maxCount?.toLocaleString() || 0}
                </div>
                <div className="text-xs opacity-90 mt-1">
                  {stats?.maxDay
                    ? new Date(stats.maxDay).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Trend Chart */}
          <TrendChart data={chartData} period={selectedPeriod} />
        </div>
      </div>

      {/* Goal Edit Modal */}
      {showGoalModal && (
        <div className="modal modal-open">
          <motion.div
            className="modal-box bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="font-bold text-xl mb-4 text-white">
              Set Daily Goal
            </h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">
                  Daily Target (zikr count)
                </span>
              </label>
              <input
                type="number"
                min="1"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="input input-bordered bg-slate-700 text-white border-slate-600 focus:border-teal-500"
                placeholder="Enter your daily goal"
              />
            </div>
            <div className="modal-action">
              <button
                className="btn bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                onClick={() => setShowGoalModal(false)}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                className="btn bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white border-none shadow-lg"
                onClick={handleUpdateGoal}
                disabled={updating || !newGoal || newGoal < 1}
              >
                {updating ? "Updating..." : "Save Goal"}
              </button>
            </div>
          </motion.div>
          <div
            className="modal-backdrop bg-black/70"
            onClick={() => setShowGoalModal(false)}
          />
        </div>
      )}
    </div>
  );
}
