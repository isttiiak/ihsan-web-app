import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChartBarIcon, FireIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idToken = localStorage.getItem("ihsan_idToken");
    if (!idToken) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/zikr/summary`,
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        if (res.status === 401) {
          setUnauthorized(true);
          return;
        }
        const data = await res.json();
        setSummary(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ihsan-light via-base-100 to-ihsan-light/50 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-islamic border border-ihsan-primary/10 max-w-md">
          <div className="card-body text-center">
            <ChartBarIcon className="w-16 h-16 mx-auto text-ihsan-primary/50" />
            <h3 className="text-xl font-bold">Authentication Required</h3>
            <p className="text-sm opacity-70">
              Please log in to view your analytics.
            </p>
            <div className="card-actions justify-center mt-4">
              <a
                href="/login"
                className="btn bg-gradient-teal text-white border-0"
              >
                Log In
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary || !summary.totalCount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ihsan-light via-base-100 to-ihsan-light/50 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-islamic border border-ihsan-primary/10 max-w-md">
          <div className="card-body text-center">
            <ChartBarIcon className="w-16 h-16 mx-auto text-ihsan-primary/50" />
            <h3 className="text-xl font-bold">No Data Yet</h3>
            <p className="text-sm opacity-70">
              Start counting your Zikr to see analytics here.
            </p>
            <div className="card-actions justify-center mt-4">
              <a href="/" className="btn bg-gradient-teal text-white border-0">
                Start Counting
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...(summary.perType?.map((t) => t.total) || [1]));

  return (
    <div className="min-h-screen bg-gradient-to-br from-ihsan-light via-base-100 to-ihsan-light/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-teal bg-clip-text text-transparent mb-2">
            Analytics
          </h1>
          <p className="text-sm sm:text-base opacity-70">
            Track your spiritual progress
          </p>
        </motion.div>

        {/* Total Count Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-ihsan-primary to-ihsan-secondary text-white shadow-islamic-lg"
        >
          <div className="card-body p-6 sm:p-8 lg:p-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FireIcon className="w-8 h-8 sm:w-10 sm:h-10" />
              <h2 className="text-xl sm:text-2xl font-semibold">
                Total Zikr Count
              </h2>
            </div>
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full" />
              <div className="relative text-6xl sm:text-7xl lg:text-8xl font-bold drop-shadow-2xl">
                {summary.totalCount.toLocaleString()}
              </div>
            </div>
            <p className="mt-4 text-white/80 text-sm sm:text-base">
              All-time remembrance of Allah
            </p>
          </div>
        </motion.div>

        {/* Per Zikr Type Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <ChartBarIcon className="w-6 h-6 text-ihsan-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-ihsan-primary">
              Breakdown by Type
            </h2>
          </div>

          {summary.perType?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.perType.map((t, index) => (
                <motion.div
                  key={t.zikrType}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="card bg-base-100 shadow-md hover:shadow-islamic border border-ihsan-primary/10 hover:border-ihsan-primary/30 transition-all duration-300"
                >
                  <div className="card-body p-4 sm:p-6">
                    <h3 className="font-semibold text-base sm:text-lg text-ihsan-primary truncate">
                      {t.zikrType}
                    </h3>
                    <div className="text-3xl sm:text-4xl font-bold text-ihsan-secondary">
                      {t.total.toLocaleString()}
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(t.total / maxCount) * 100}%` }}
                          transition={{
                            delay: 0.3 + index * 0.05,
                            duration: 0.8,
                          }}
                          className="h-full bg-gradient-teal rounded-full"
                        />
                      </div>
                      <p className="text-xs opacity-60 mt-1">
                        {((t.total / summary.totalCount) * 100).toFixed(1)}% of
                        total
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card bg-base-100 shadow-md border border-ihsan-primary/10">
              <div className="card-body text-center p-8">
                <p className="opacity-70">No zikr types recorded yet.</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card bg-base-100 shadow-md border border-ihsan-primary/10"
          >
            <div className="card-body p-4 text-center">
              <ClockIcon className="w-8 h-8 mx-auto text-ihsan-primary mb-2" />
              <div className="text-2xl font-bold text-ihsan-primary">
                {summary.perType?.length || 0}
              </div>
              <p className="text-xs opacity-70">Types</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="card bg-base-100 shadow-md border border-ihsan-secondary/10"
          >
            <div className="card-body p-4 text-center">
              <FireIcon className="w-8 h-8 mx-auto text-ihsan-secondary mb-2" />
              <div className="text-2xl font-bold text-ihsan-secondary">
                {summary.perType && summary.perType.length > 0
                  ? Math.max(
                      ...summary.perType.map((t) => t.total)
                    ).toLocaleString()
                  : 0}
              </div>
              <p className="text-xs opacity-70">Most Count</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card bg-base-100 shadow-md border border-ihsan-accent/10"
          >
            <div className="card-body p-4 text-center">
              <ChartBarIcon className="w-8 h-8 mx-auto text-ihsan-accent mb-2" />
              <div className="text-2xl font-bold text-ihsan-accent">
                {summary.perType && summary.perType.length > 0
                  ? Math.round(
                      summary.totalCount / summary.perType.length
                    ).toLocaleString()
                  : 0}
              </div>
              <p className="text-xs opacity-70">Avg/Type</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="card bg-base-100 shadow-md border border-ihsan-primary/10"
          >
            <div className="card-body p-4 text-center">
              <FireIcon className="w-8 h-8 mx-auto text-ihsan-primary mb-2" />
              <div className="text-2xl font-bold text-ihsan-primary">
                {summary.totalCount.toLocaleString()}
              </div>
              <p className="text-xs opacity-70">All Time</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
