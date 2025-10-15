import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useZikrStore } from "../store/useZikrStore";

export default function Home() {
  const { user } = useAuthStore();
  const { counts } = useZikrStore();

  // Calculate total count for today
  const totalToday = Object.values(counts).reduce(
    (sum, count) => sum + count,
    0
  );
  const zikrTypes = Object.keys(counts).length;

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const activities = [
    {
      id: "zikr",
      icon: "📿",
      title: "Zikr Counter",
      description: "Continue your remembrance of Allah",
      stats: {
        label: "Today",
        value: totalToday,
      },
      action: "Start Counting",
      link: "/zikr",
      gradient: "from-ihsan-secondary to-ihsan-primary",
      iconBg: "bg-ihsan-secondary/20",
    },
    {
      id: "salat",
      icon: "🕌",
      title: "Salat Tracker",
      description: "Track your daily prayers",
      stats: {
        label: "Today",
        value: "0/5",
      },
      action: "Track Prayer",
      link: "/salat",
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-500/20",
    },
    {
      id: "fasting",
      icon: "🌙",
      title: "Fasting Tracker",
      description: "Monitor your fasting journey",
      stats: {
        label: "Streak",
        value: "0 days",
      },
      action: "Log Fast",
      link: "/fasting",
      gradient: "from-purple-500 to-pink-600",
      iconBg: "bg-purple-500/20",
    },
    {
      id: "prayer-times",
      icon: "⏰",
      title: "Prayer Times",
      description: "Never miss a prayer",
      stats: {
        label: "Next Prayer",
        value: "Fajr",
      },
      action: "View Times",
      link: "/prayer-times",
      gradient: "from-ihsan-accent to-yellow-600",
      iconBg: "bg-ihsan-accent/20",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ihsan-light via-base-100 to-ihsan-light/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            <span className="text-ihsan-primary">Assalamu alaykum</span>
            {user?.displayName && (
              <span className="text-ihsan-secondary">
                , {user.displayName.split(" ")[0]}
              </span>
            )}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl opacity-70">
            {getGreeting()}! What would you like to focus on today?
          </p>
        </motion.div>

        {/* Activity Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={activity.link}
                className="card bg-base-100 shadow-lg hover:shadow-islamic-lg border border-ihsan-primary/20 hover:border-ihsan-primary/40 transition-all duration-300 hover:scale-[1.02] h-full group"
              >
                <div className="card-body p-6 sm:p-8">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${activity.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <span className="text-4xl sm:text-5xl">
                      {activity.icon}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-teal bg-clip-text text-transparent mb-2">
                    {activity.title}
                  </h2>
                  <p className="text-sm sm:text-base opacity-70 mb-4">
                    {activity.description}
                  </p>

                  {/* Stats */}
                  <div
                    className={`bg-gradient-to-r ${activity.gradient} rounded-lg p-4 mb-4`}
                  >
                    <div className="text-center text-white">
                      <div className="text-2xl sm:text-3xl font-bold drop-shadow-lg">
                        {activity.stats.value}
                      </div>
                      <div className="text-xs sm:text-sm opacity-90">
                        {activity.stats.label}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    className={`btn w-full bg-gradient-to-r ${activity.gradient} text-white border-0 hover:shadow-islamic transition-all group-hover:scale-105`}
                  >
                    {activity.action}
                    <svg
                      className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats Bar (Optional) */}
        {user && totalToday > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card bg-gradient-to-r from-ihsan-primary to-ihsan-secondary text-white shadow-islamic-lg"
          >
            <div className="card-body p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Today's Progress
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">{totalToday}</div>
                  <div className="text-sm opacity-90">Total Count</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{zikrTypes}</div>
                  <div className="text-sm opacity-90">Zikr Types</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {zikrTypes > 0 ? Math.round(totalToday / zikrTypes) : 0}
                  </div>
                  <div className="text-sm opacity-90">Avg per Type</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Add Custom Activity Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <button className="btn btn-outline btn-lg gap-2 hover:bg-ihsan-primary/10">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Custom Activity
          </button>
        </motion.div>
      </div>
    </div>
  );
}
