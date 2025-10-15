import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Cog6ToothIcon,
  PaintBrushIcon,
  SparklesIcon,
  UserCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";

export default function Settings() {
  const { aiEnabled, setAiEnabled } = useAuthStore();
  const [theme, setTheme] = useState(
    localStorage.getItem("ihsan_theme") || "emerald"
  );
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ihsan_theme", theme);
  }, [theme]);

  const getSuggestions = async () => {
    setLoadingSuggest(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai/suggest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userSummary: "Example summary placeholder.",
          }),
        }
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggest(false);
    }
  };

  const exportProfile = () => {
    const data = JSON.stringify(
      JSON.parse(localStorage.getItem("ihsan_user") || "{}"),
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ihsan-user.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProfile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      localStorage.setItem("ihsan_user", JSON.stringify(data));
      alert("Imported local profile cache. Refresh to reflect changes.");
    } catch {
      alert("Invalid file");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ihsan-light via-base-100 to-ihsan-light/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Cog6ToothIcon className="w-8 h-8 sm:w-10 sm:h-10 text-ihsan-primary" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-teal bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <p className="text-sm sm:text-base opacity-70">
            Customize your experience
          </p>
        </motion.div>

        {/* Theme Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-base-100 shadow-islamic border border-ihsan-primary/10"
        >
          <div className="card-body p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <PaintBrushIcon className="w-6 h-6 text-ihsan-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-ihsan-primary">
                Appearance
              </h2>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Theme</span>
                <span className="label-text-alt text-xs opacity-60">
                  Choose your preferred color scheme
                </span>
              </label>
              <select
                className="select select-bordered w-full focus:border-ihsan-primary focus:outline-none focus:ring-2 focus:ring-ihsan-primary/20 transition-all"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="emerald">🌊 Emerald (Default)</option>
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* AI Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-base-100 shadow-islamic border border-ihsan-primary/10"
        >
          <div className="card-body p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <SparklesIcon className="w-6 h-6 text-ihsan-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-ihsan-primary">
                AI Features
              </h2>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                />
                <div>
                  <span className="label-text font-medium block">
                    Enable AI suggestions
                  </span>
                  <span className="label-text-alt text-xs opacity-60">
                    Get personalized recommendations
                  </span>
                </div>
              </label>
            </div>

            {aiEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 space-y-4"
              >
                <div className="divider"></div>
                <button
                  className="btn btn-lg w-full sm:w-auto bg-gradient-teal text-white border-0 hover:shadow-islamic transition-all gap-2"
                  onClick={getSuggestions}
                  disabled={loadingSuggest}
                >
                  {loadingSuggest ? (
                    <>
                      <span className="loading loading-spinner loading-md" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <LightBulbIcon className="w-5 h-5" />
                      Get AI Suggestions
                    </>
                  )}
                </button>

                {suggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card bg-gradient-to-br from-ihsan-secondary/10 to-ihsan-primary/10 border border-ihsan-primary/20"
                  >
                    <div className="card-body p-4">
                      <h4 className="font-semibold text-ihsan-primary mb-2">
                        AI Suggestions
                      </h4>
                      <ul className="space-y-2">
                        {suggestions.suggestions?.map((s, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-ihsan-accent">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                      {suggestions.motivation && (
                        <div className="mt-3 pt-3 border-t border-ihsan-primary/20">
                          <p className="text-sm italic opacity-80">
                            {suggestions.motivation}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Profile Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card bg-base-100 shadow-islamic border border-ihsan-primary/10"
        >
          <div className="card-body p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <UserCircleIcon className="w-6 h-6 text-ihsan-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-ihsan-primary">
                Profile
              </h2>
            </div>

            <Link
              to="/profile"
              className="btn btn-outline btn-primary gap-2 w-full sm:w-auto"
            >
              <UserCircleIcon className="w-5 h-5" />
              Edit Profile
            </Link>
          </div>
        </motion.div>

        {/* Data Management Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-base-100 shadow-islamic border border-ihsan-primary/10"
        >
          <div className="card-body p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <ArrowDownTrayIcon className="w-6 h-6 text-ihsan-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-ihsan-primary">
                Data Management
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="btn btn-outline gap-2 flex-1"
                onClick={exportProfile}
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Export Profile
              </button>
              <label className="btn btn-outline gap-2 flex-1">
                <ArrowUpTrayIcon className="w-5 h-5" />
                Import Profile
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={importProfile}
                />
              </label>
            </div>
            <p className="text-xs opacity-60 mt-2">
              Back up your profile data or restore from a previous export
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
