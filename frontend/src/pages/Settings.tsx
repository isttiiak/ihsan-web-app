import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useUiStore } from '../store/useUiStore.js';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import {
  Cog6ToothIcon,
  PaintBrushIcon,
  SparklesIcon,
  UserCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  LightBulbIcon,
  EyeDropperIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import BackButton from '../components/BackButton.js';

interface AiSuggestionsResponse {
  suggestions?: string[];
  motivation?: string;
}

export default function Settings() {
  const { aiEnabled, setAiEnabled } = useAuthStore();
  const { reduceMotion, highContrast, setReduceMotion, setHighContrast } = useUiStore();
  const [theme, setTheme] = useState(localStorage.getItem('ihsan_theme') || 'ihsan');
  const [suggestions, setSuggestions] = useState<AiSuggestionsResponse | null>(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ihsan_theme', theme);
  }, [theme]);

  const getSuggestions = async () => {
    setLoadingSuggest(true);
    try {
      const idToken = localStorage.getItem('ihsan_idToken');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken ?? ''}` },
        body: JSON.stringify({ userSummary: 'Example summary placeholder.' }),
      });
      const data = await res.json() as AiSuggestionsResponse;
      setSuggestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggest(false);
    }
  };

  const exportProfile = () => {
    const data = JSON.stringify(JSON.parse(localStorage.getItem('ihsan_user') || '{}'), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ihsan-user.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text) as unknown;
      localStorage.setItem('ihsan_user', JSON.stringify(data));
      alert('Imported local profile cache. Refresh to reflect changes.');
    } catch {
      alert('Invalid file');
    }
  };

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-start"><BackButton /></div>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Cog6ToothIcon className="w-8 h-8 sm:w-10 sm:h-10 text-brand-emerald" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-emerald">Settings</h1>
            </div>
            <p className="text-sm sm:text-base text-white/60">Customize your experience</p>
          </motion.div>

          {/* Theme Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-brand-surface border border-brand-border shadow-glass"
          >
            <div className="card-body p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <PaintBrushIcon className="w-6 h-6 text-brand-emerald" />
                <h2 className="text-xl sm:text-2xl font-bold text-brand-emerald">Appearance</h2>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-white/80">Theme</span>
                  <span className="label-text-alt text-xs text-white/40">Choose your preferred color scheme</span>
                </label>
                <select
                  className="select select-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="ihsan">🌑 Ihsan Dark (Default)</option>
                  <option value="light">☀️ Light</option>
                </select>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="label cursor-pointer justify-start gap-4 p-3 rounded-xl border border-brand-border bg-brand-deep/50">
                  <input type="checkbox" className="toggle toggle-success" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} />
                  <div>
                    <div className="flex items-center gap-2 font-medium text-white/80">
                      <EyeIcon className="w-5 h-5" /> Reduce animations
                    </div>
                    <div className="label-text-alt text-xs text-white/40">Respect motion sensitivity and tone down effects</div>
                  </div>
                </label>

                <label className="label cursor-pointer justify-start gap-4 p-3 rounded-xl border border-brand-border bg-brand-deep/50">
                  <input type="checkbox" className="toggle toggle-warning" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
                  <div>
                    <div className="flex items-center gap-2 font-medium text-white/80">
                      <EyeDropperIcon className="w-5 h-5" /> High contrast mode
                    </div>
                    <div className="label-text-alt text-xs text-white/40">Stronger text and focus outlines for clarity</div>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* AI Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card bg-brand-surface border border-brand-border shadow-glass"
          >
            <div className="card-body p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <SparklesIcon className="w-6 h-6 text-brand-emerald" />
                <h2 className="text-xl sm:text-2xl font-bold text-brand-emerald">AI Features</h2>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input type="checkbox" className="toggle toggle-primary" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />
                  <div>
                    <span className="label-text font-medium block text-white/80">Enable AI suggestions</span>
                    <span className="label-text-alt text-xs text-white/40">Get personalized recommendations</span>
                  </div>
                </label>
              </div>

              {aiEnabled && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-4">
                  <div className="divider" />
                  <button
                    className="btn btn-lg w-full sm:w-auto bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 transition-all gap-2"
                    onClick={getSuggestions}
                    disabled={loadingSuggest}
                  >
                    {loadingSuggest ? (
                      <><span className="loading loading-spinner loading-md" /> Loading...</>
                    ) : (
                      <><LightBulbIcon className="w-5 h-5" /> Get AI Suggestions</>
                    )}
                  </button>

                  {suggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card bg-brand-deep border border-brand-border"
                    >
                      <div className="card-body p-4">
                        <h4 className="font-semibold text-brand-emerald mb-2">AI Suggestions</h4>
                        <ul className="space-y-2">
                          {suggestions.suggestions?.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                              <span className="text-brand-gold">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                        {suggestions.motivation && (
                          <div className="mt-3 pt-3 border-t border-brand-border">
                            <p className="text-sm italic text-white/60">{suggestions.motivation}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card bg-brand-surface border border-brand-border shadow-glass"
          >
            <div className="card-body p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <UserCircleIcon className="w-6 h-6 text-brand-emerald" />
                <h2 className="text-xl sm:text-2xl font-bold text-brand-emerald">Profile</h2>
              </div>
              <Link to="/profile" className="btn btn-outline border-brand-emerald text-brand-emerald hover:bg-brand-emerald hover:text-white gap-2 w-full sm:w-auto">
                <UserCircleIcon className="w-5 h-5" />
                Edit Profile
              </Link>
            </div>
          </motion.div>

          {/* Data Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card bg-brand-surface border border-brand-border shadow-glass"
          >
            <div className="card-body p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <ArrowDownTrayIcon className="w-6 h-6 text-brand-emerald" />
                <h2 className="text-xl sm:text-2xl font-bold text-brand-emerald">Data Management</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="btn btn-outline border-brand-border text-white/80 hover:border-brand-emerald hover:text-brand-emerald gap-2 flex-1" onClick={exportProfile}>
                  <ArrowDownTrayIcon className="w-5 h-5" /> Export Profile
                </button>
                <label className="btn btn-outline border-brand-border text-white/80 hover:border-brand-emerald hover:text-brand-emerald gap-2 flex-1">
                  <ArrowUpTrayIcon className="w-5 h-5" /> Import Profile
                  <input type="file" accept="application/json" className="hidden" onChange={importProfile} />
                </label>
              </div>
              <p className="text-xs text-white/40 mt-2">Back up your profile data or restore from a previous export</p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
