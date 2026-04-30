import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { ChartBarIcon, FireIcon, PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import StreakCard from '../components/analytics/StreakCard.js';
import GoalCard from '../components/analytics/GoalCard.js';
import TrendChart from '../components/analytics/TrendChart.js';
import {
  useAnalytics,
  useUpdateGoal,
  usePauseStreak,
  useResumeStreak,
} from '../hooks/useAnalytics.js';
import { useZikrTypes, useAddZikrType } from '../hooks/useZikrTypes.js';
import { useZikrStore } from '../store/useZikrStore.js';
import api from '../lib/api.js';
import { getUserTimezoneOffset } from '../utils/timezone.js';

// ─── Manual Entry Modal ───────────────────────────────────────────────────────

interface ManualEntryModalProps {
  onClose: () => void;
  todayPerType: Array<{ zikrType: string; total: number }>;
  localCounts: Record<string, number>;
}

function ManualEntryModal({ onClose, todayPerType, localCounts }: ManualEntryModalProps) {
  const queryClient = useQueryClient();
  const { types, addConfirmedCounts, setTypes, setCustomMeaning } = useZikrStore();
  const { data: fetchedTypes } = useZikrTypes();
  const addZikrType = useAddZikrType();

  // Merge store types + server types deduplicated
  const allTypes = [...new Set([...types, ...(fetchedTypes ?? []).map((t) => t.name)])];

  const [selectedType, setSelectedType] = useState(allTypes[0] ?? 'SubhanAllah');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Add-new-type sub-form
  const [showAddNew, setShowAddNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newArabic, setNewArabic] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  // Existing count for the selected type today
  const serverCount = todayPerType.find((t) => t.zikrType === selectedType)?.total ?? 0;
  const localCount = localCounts[selectedType] ?? 0;
  const existingCount = Math.max(serverCount, localCount);

  const parsedAmount = Math.max(0, parseInt(amount) || 0);
  const newTotal = existingCount + parsedAmount;

  const handleSubmit = async () => {
    if (parsedAmount <= 0) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.post('/api/zikr/increment/batch', {
        increments: [{ zikrType: selectedType, amount: parsedAmount, timezoneOffset: getUserTimezoneOffset() }],
        timezoneOffset: getUserTimezoneOffset(),
      });
      addConfirmedCounts(selectedType, parsedAmount);
      await queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onClose();
    } catch {
      setSubmitError('Failed to save. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNewType = () => {
    const name = newName.trim();
    const meaning = newMeaning.trim();
    if (!name || !meaning) return;
    addZikrType.mutate(name, {
      onSuccess: () => {
        setCustomMeaning(name, {
          arabic: newArabic.trim() || undefined,
          meaning,
          source: newSource.trim() || undefined,
          sourceUrl: newSourceUrl.trim() || undefined,
        });
        setTypes([...types, name]);
        setSelectedType(name);
        setShowAddNew(false);
        setNewName(''); setNewArabic(''); setNewMeaning(''); setNewSource(''); setNewSourceUrl('');
        setSubmitError('');
      },
      onError: () => setSubmitError('Failed to add dhikr type. Try again.'),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="bg-brand-surface rounded-3xl w-full max-w-md shadow-2xl border border-brand-border overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-brand-border/60">
          <div>
            <h3 className="text-lg font-black text-brand-emerald">Log Missed Counts</h3>
            <p className="text-white/35 text-xs mt-0.5">Add zikr you counted outside the app today</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!showAddNew ? (
            <>
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 uppercase tracking-wider font-bold">Zikr Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => { setSelectedType(e.target.value); setAmount(''); setSubmitError(''); }}
                  className="select select-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-sm"
                >
                  {allTypes.map((t) => (
                    <option key={t} value={t} className="bg-brand-deep">{t}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setShowAddNew(true); setSubmitError(''); }}
                  className="flex items-center gap-1.5 text-brand-emerald/70 hover:text-brand-emerald text-xs font-semibold transition-colors"
                >
                  <PlusCircleIcon className="w-3.5 h-3.5" />
                  Add a new dhikr type
                </button>
              </div>

              {/* Today's existing count */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/50 text-sm">Today's count so far</span>
                <span className="text-white font-black text-lg tabular-nums">{existingCount.toLocaleString()}</span>
              </div>

              {/* Amount to add */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 uppercase tracking-wider font-bold">Counts to add</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setSubmitError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
                  placeholder="e.g. 100"
                  className="input input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-lg font-bold"
                  autoFocus
                />
              </div>

              {/* Total preview */}
              {parsedAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30"
                >
                  <span className="text-brand-emerald/80 text-sm font-semibold">
                    {existingCount.toLocaleString()} + {parsedAmount.toLocaleString()}
                  </span>
                  <span className="text-brand-emerald font-black text-xl tabular-nums">
                    = {newTotal.toLocaleString()}
                  </span>
                </motion.div>
              )}

              {submitError && <p className="text-red-400 text-xs">{submitError}</p>}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="btn flex-1 btn-ghost text-white/60 border-brand-border">
                  Cancel
                </button>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={parsedAmount <= 0 || submitting}
                  className="btn flex-1 bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 font-bold disabled:opacity-40"
                >
                  {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Save Counts'}
                </button>
              </div>
            </>
          ) : (
            // ── Add new dhikr sub-form ─────────────────────────────────────────
            <>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => { setShowAddNew(false); setSubmitError(''); }}
                  className="text-white/40 hover:text-white text-xs transition-colors flex items-center gap-1"
                >
                  ← Back
                </button>
                <span className="text-white/25 text-xs">New Dhikr Type</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Hasbunallah"
                    className="input input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">
                    Arabic <span className="text-white/25">(optional)</span>
                  </label>
                  <input
                    value={newArabic}
                    onChange={(e) => setNewArabic(e.target.value)}
                    placeholder="حَسْبُنَا اللَّهُ"
                    dir="rtl"
                    className="input input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-base"
                    style={{ fontFamily: "'Amiri', serif" }}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">
                    English Meaning <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    placeholder="Allah is sufficient for us"
                    className="input input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-sm"
                  />
                </div>
                <div className="border-t border-brand-border/60 pt-3 space-y-2">
                  <p className="text-white/25 text-[10px] uppercase tracking-wider">Source <span className="normal-case text-white/20">(optional)</span></p>
                  <input
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="e.g. Quran 3:173"
                    className="input input-sm input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-xs"
                  />
                  <input
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="https://quran.com/3/173"
                    className="input input-sm input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-xs"
                  />
                </div>
              </div>

              {submitError && <p className="text-red-400 text-xs">{submitError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setShowAddNew(false); setSubmitError(''); }}
                  className="btn flex-1 btn-ghost text-white/60 border-brand-border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewType}
                  disabled={!newName.trim() || !newMeaning.trim() || addZikrType.isPending}
                  className="btn flex-1 bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 font-bold disabled:opacity-40"
                >
                  {addZikrType.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Add Dhikr'}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ZikrAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState(100);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const { counts: localCounts } = useZikrStore();
  const { data: analyticsData, isLoading, isError, error, refetch } = useAnalytics(selectedPeriod);
  const updateGoal = useUpdateGoal();
  const pauseStreak = usePauseStreak();
  const resumeStreak = useResumeStreak();

  const periods = [
    { label: '7 Days', value: 7 },
    { label: '15 Days', value: 15 },
    { label: '30 Days', value: 30 },
    { label: '60 Days', value: 60 },
    { label: '90 Days', value: 90 },
    { label: '180 Days', value: 180 },
  ];

  const handlePauseStreak = () => pauseStreak.mutate();
  const handleResumeStreak = () => resumeStreak.mutate();
  const isUpdating = pauseStreak.isPending || resumeStreak.isPending || updateGoal.isPending;

  const handleUpdateGoal = () => {
    if (!newGoal || newGoal < 1) return;
    updateGoal.mutate(newGoal, { onSuccess: () => setShowGoalModal(false) });
  };

  if (isLoading) {
    return (
      <AnimatedBackground variant="dark">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-brand-emerald" />
            <p className="text-sm text-brand-emerald font-semibold">Loading analytics…</p>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  if (isError || !analyticsData) {
    const errMsg = (error as Error)?.message ?? 'Failed to load analytics data.';
    const isRateLimit = errMsg.includes('429') || errMsg.toLowerCase().includes('too many');
    return (
      <AnimatedBackground variant="dark">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-6 max-w-sm text-center">
            <div className="text-5xl">{isRateLimit ? '⏳' : '⚠️'}</div>
            <div>
              <p className="text-lg font-bold text-white mb-1">
                {isRateLimit ? 'Too many requests' : 'Could not load analytics'}
              </p>
              <p className="text-sm text-white/50">
                {isRateLimit ? "You've hit the rate limit. Please wait a minute and try again." : errMsg}
              </p>
            </div>
            <button className="btn bg-brand-emerald hover:bg-brand-emerald-dim text-white border-none" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  const { chartData, today, goal, streak, allTime } = analyticsData;
  const todayTypes = today?.perType ?? [];
  const todayTotal = today?.total ?? 0;
  const allTimeTypes = analyticsData.perType ?? [];
  const displayData = activeTab === 'today' ? todayTypes : allTimeTypes;
  const displayTotal = activeTab === 'today' ? todayTotal : allTime?.totalCount ?? 0;

  // Last 7 days from chartData for the heatmap
  const last7Days = chartData?.slice(-7) ?? [];

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8 relative">
        <div className="max-w-7xl mx-auto space-y-8 relative z-10">

          {/* Tab navigation */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 max-w-xs">
              <Link
                to="/zikr"
                className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all"
              >
                📿 Counter
              </Link>
              <span className="flex-1 text-center text-xs font-bold py-1.5 rounded-lg bg-white/10 text-white">
                📊 Analytics
              </span>
            </div>

            {/* Log missed counts button */}
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowManualEntry(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-emerald/15 hover:bg-brand-emerald/25 border border-brand-emerald/40 hover:border-brand-emerald/70 text-brand-emerald text-sm font-bold transition-all"
            >
              <PlusCircleIcon className="w-4 h-4" />
              Log Missed Counts
            </motion.button>
          </div>

          {/* Streak + Goal cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StreakCard
              streak={streak}
              onPause={handlePauseStreak}
              onResume={handleResumeStreak}
              isLoading={isUpdating}
              chartData={last7Days}
              dailyGoal={goal?.dailyTarget}
              todayTotal={todayTotal}
            />
            <GoalCard
              goal={goal}
              today={today}
              onEditGoal={() => { setNewGoal(goal?.dailyTarget ?? 100); setShowGoalModal(true); }}
            />
          </div>

          {/* Overview Statistics */}
          <div className="space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl font-black text-brand-emerald flex items-center gap-3"
            >
              <ChartBarIcon className="w-8 h-8" /> Overview Statistics
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ delay: 0.05 }}
                className="sm:col-span-2 lg:col-span-1 card relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-emerald via-teal-600 to-cyan-600 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_48px_rgba(16,185,129,0.6)] cursor-pointer group"
              >
                <div className="absolute inset-0 opacity-40">
                  <motion.div
                    className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                </div>
                <div className="card-body p-5 sm:p-6 relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                      <FireIcon className="w-6 h-6 text-white drop-shadow-lg" />
                    </motion.div>
                    <h3 className="text-sm font-bold text-white/90 uppercase tracking-wide">Total Zikr</h3>
                  </div>
                  <div className="text-5xl sm:text-6xl font-black text-white mb-2 drop-shadow-2xl">
                    {allTime?.totalCount?.toLocaleString() ?? 0}
                  </div>
                  <p className="text-xs text-white/80 font-medium">✨ All-time remembrance</p>
                </div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </motion.div>

              {[
                { label: '📅 Today', value: todayTotal.toLocaleString(), delay: 0.1, gradient: 'from-brand-gold to-amber-400', textGrad: 'from-amber-300 to-orange-300' },
                {
                  label: '🏆 Best',
                  value: allTime?.bestDay?.count?.toLocaleString() ?? '0',
                  delay: 0.15,
                  gradient: 'from-brand-emerald to-emerald-400',
                  textGrad: 'from-green-300 to-emerald-300',
                  sub: allTime?.bestDay?.date
                    ? new Date(allTime.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'N/A',
                },
                { label: '🎯 Types', value: allTimeTypes.filter((t) => t.total > 0).length, delay: 0.2, gradient: 'from-brand-magenta to-rose-400', textGrad: 'from-pink-300 to-rose-300' },
              ].map(({ label, value, delay, gradient, textGrad, sub }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ delay }}
                  className="card backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg cursor-pointer"
                >
                  <div className="card-body p-5 sm:p-6">
                    <div className={`text-xs sm:text-sm font-bold mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent uppercase tracking-wide`}>{label}</div>
                    <div className={`text-4xl sm:text-5xl font-black bg-gradient-to-br ${textGrad} bg-clip-text text-transparent`}>{value}</div>
                    {sub && <div className="text-xs text-white/40 mt-2 font-medium">{sub}</div>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Breakdown by Type */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 flex-wrap gap-4">
              <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent flex items-center gap-3">
                <ChartBarIcon className="w-8 h-8 text-purple-400" /> Breakdown by Type
              </h2>
              <div className="tabs tabs-boxed bg-brand-deep border border-brand-border shadow-lg">
                {(['today', 'all'] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`tab ${activeTab === tab ? 'tab-active bg-brand-emerald text-white font-bold' : 'text-white/60 hover:text-white'}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'today' ? '📅 Today' : '✨ All Time'}
                  </button>
                ))}
              </div>
            </div>

            {displayData?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayData.map((t, index) => {
                  const gradients = ['from-cyan-600 via-blue-600 to-indigo-600', 'from-violet-600 via-purple-600 to-fuchsia-600', 'from-rose-600 via-pink-600 to-red-600', 'from-amber-600 via-orange-600 to-red-600', 'from-emerald-600 via-teal-600 to-cyan-600', 'from-indigo-600 via-blue-600 to-cyan-600'];
                  return (
                    <motion.div
                      key={t.zikrType}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -8, scale: 1.03 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className={`card relative overflow-hidden bg-gradient-to-br ${gradients[index % gradients.length]} backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer rounded-2xl group`}
                    >
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.6 }} />
                      <div className="card-body p-6 relative z-10">
                        <h3 className="font-black text-xl sm:text-2xl truncate text-white drop-shadow-lg">{t.zikrType}</h3>
                        <div className="text-5xl sm:text-6xl font-black text-white drop-shadow-2xl my-2">{t.total.toLocaleString()}</div>
                        <div className="mt-4">
                          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${displayTotal > 0 ? (t.total / displayTotal) * 100 : 0}%` }}
                              transition={{ delay: 0.2 + index * 0.05, duration: 0.8 }}
                              className="h-full bg-white rounded-full shadow-lg"
                            />
                          </div>
                          <p className="text-sm font-bold text-white/90 mt-2">
                            {displayTotal > 0 ? ((t.total / displayTotal) * 100).toFixed(1) : '0.0'}% of{activeTab === 'today' ? ' today' : ' total'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="card bg-brand-surface border border-brand-border rounded-2xl">
                <div className="card-body text-center p-12">
                  <p className="text-white/40 text-lg">No zikr recorded yet for {activeTab === 'today' ? 'today' : 'all time'}.</p>
                </div>
              </div>
            )}
          </div>

          {/* Trends & Insights */}
          <div className="space-y-6 mt-12 pt-8 border-t-2 border-brand-border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-3xl sm:text-4xl font-black text-brand-emerald flex items-center gap-3">
                <ChartBarIcon className="w-8 h-8" /> Trends & Insights
              </h2>
              <div className="tabs tabs-boxed bg-brand-deep border border-brand-border shadow-lg">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    className={`tab ${selectedPeriod === period.value ? 'tab-active bg-brand-emerald text-white font-bold' : 'text-white/60 hover:text-white'}`}
                    onClick={() => setSelectedPeriod(period.value)}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
            <TrendChart data={chartData} period={selectedPeriod} />
          </div>
        </div>

        {/* Set Goal modal */}
        {showGoalModal && (
          <div className="modal modal-open">
            <motion.div
              className="modal-box bg-brand-surface border border-brand-border shadow-2xl rounded-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="font-black text-2xl mb-6 text-brand-emerald">Set Daily Goal</h3>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white/70 font-semibold">Daily Target (zikr count)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={newGoal}
                  onChange={(e) => setNewGoal(parseInt(e.target.value) || 0)}
                  className="input input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald"
                  placeholder="Enter your daily goal"
                />
              </div>
              <div className="modal-action">
                <button className="btn bg-brand-deep border-brand-border text-white/60" onClick={() => setShowGoalModal(false)} disabled={isUpdating}>Cancel</button>
                <button
                  className="btn bg-brand-emerald hover:bg-brand-emerald-dim text-white border-none font-bold"
                  onClick={handleUpdateGoal}
                  disabled={isUpdating || !newGoal || newGoal < 1}
                >
                  {updateGoal.isPending ? 'Updating...' : 'Save Goal'}
                </button>
              </div>
            </motion.div>
            <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={() => setShowGoalModal(false)} />
          </div>
        )}
      </div>

      {/* Manual entry modal */}
      <AnimatePresence>
        {showManualEntry && (
          <ManualEntryModal
            onClose={() => setShowManualEntry(false)}
            todayPerType={todayTypes}
            localCounts={localCounts}
          />
        )}
      </AnimatePresence>
    </AnimatedBackground>
  );
}
