import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";

export default function FastingTracker() {
  const navigate = useNavigate();
  const [fastingData, setFastingData] = useState(() => {
    const saved = localStorage.getItem("ihsan_fasting_data");
    return saved
      ? JSON.parse(saved)
      : {
          currentStreak: 0,
          totalDays: 0,
          isFastingToday: false,
          lastFastDate: null,
          monthlyGoal: 30,
        };
  });

  const saveFastingData = (data) => {
    setFastingData(data);
    localStorage.setItem("ihsan_fasting_data", JSON.stringify(data));
  };

  const toggleFastingToday = () => {
    const today = new Date().toDateString();
    const newData = {
      ...fastingData,
      isFastingToday: !fastingData.isFastingToday,
      lastFastDate: !fastingData.isFastingToday
        ? today
        : fastingData.lastFastDate,
      totalDays: !fastingData.isFastingToday
        ? fastingData.totalDays + 1
        : fastingData.totalDays - 1,
      currentStreak: !fastingData.isFastingToday
        ? fastingData.currentStreak + 1
        : fastingData.currentStreak - 1,
    };
    saveFastingData(newData);
  };

  const resetStreak = () => {
    if (confirm("Are you sure you want to reset your fasting streak?")) {
      saveFastingData({
        currentStreak: 0,
        totalDays: 0,
        isFastingToday: false,
        lastFastDate: null,
        monthlyGoal: fastingData.monthlyGoal,
      });
    }
  };

  const setGoal = () => {
    const goal = prompt(
      "Enter your monthly fasting goal:",
      fastingData.monthlyGoal
    );
    if (goal && !isNaN(goal)) {
      saveFastingData({
        ...fastingData,
        monthlyGoal: parseInt(goal),
      });
    }
  };

  // Check if new day
  useEffect(() => {
    const checkNewDay = () => {
      const today = new Date().toDateString();
      if (
        fastingData.lastFastDate &&
        fastingData.lastFastDate !== today &&
        fastingData.isFastingToday
      ) {
        saveFastingData({
          ...fastingData,
          isFastingToday: false,
        });
      }
    };
    checkNewDay();
  }, []);

  const progressPercentage =
    (fastingData.totalDays / fastingData.monthlyGoal) * 100;

  return (
    <AnimatedBackground variant="default">
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
          <div className="text-6xl sm:text-7xl mb-4">🌙</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Fasting Tracker
          </h1>
          <p className="text-lg sm:text-xl text-white/80">
            Monitor your fasting journey
          </p>
        </motion.div>

        {/* Today's Fast Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card bg-white shadow-2xl mb-8"
        >
          <div className="card-body p-8 text-center">
            <h2 className="text-2xl font-bold text-purple-900 mb-4">
              Are you fasting today?
            </h2>
            <button
              onClick={toggleFastingToday}
              className={`btn btn-lg w-full sm:w-auto ${
                fastingData.isFastingToday
                  ? "btn-success"
                  : "btn-outline btn-primary"
              }`}
            >
              {fastingData.isFastingToday ? (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Yes, I'm Fasting
                </>
              ) : (
                "Mark as Fasting"
              )}
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg"
          >
            <div className="card-body p-6 text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                {fastingData.currentStreak}
              </div>
              <p className="text-white/80">Current Streak</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg"
          >
            <div className="card-body p-6 text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                {fastingData.totalDays}
              </div>
              <p className="text-white/80">Total Days</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg"
          >
            <div className="card-body p-6 text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                {fastingData.monthlyGoal}
              </div>
              <p className="text-white/80">Monthly Goal</p>
            </div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card bg-white shadow-lg mb-8"
        >
          <div className="card-body p-6">
            <h3 className="font-semibold text-purple-900 mb-4">
              Monthly Progress: {fastingData.totalDays} /{" "}
              {fastingData.monthlyGoal} days
            </h3>
            <div className="w-full bg-purple-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {progressPercentage >= 100
                ? "Goal achieved! Masha'Allah!"
                : `${(100 - progressPercentage).toFixed(0)}% remaining`}
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={setGoal}
            className="btn btn-outline text-white border-white hover:bg-white hover:text-purple-900"
          >
            Set Monthly Goal
          </button>
          <button
            onClick={resetStreak}
            className="btn btn-outline text-white border-white hover:bg-white hover:text-purple-900"
          >
            Reset Streak
          </button>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 card bg-white/10 backdrop-blur-sm border border-white/20"
        >
          <div className="card-body p-6">
            <h3 className="font-semibold text-white mb-3">💡 Fasting Tips</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• Drink plenty of water during non-fasting hours</li>
              <li>• Eat nutritious suhoor (pre-dawn meal)</li>
              <li>• Break fast with dates and water</li>
              <li>• Make sincere intention (niyyah) before dawn</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </AnimatedBackground>
  );
}
