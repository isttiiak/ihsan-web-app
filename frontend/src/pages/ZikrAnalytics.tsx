import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import AnimatedBackground from '../components/AnimatedBackground.js';
import TabNav from '../components/TabNav.js';
import { ChartBarIcon, PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
import { getTrackingDay, getTrackingDayMiddayTs } from '../utils/trackingDay.js';

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
  // 0 = today, 1 = yesterday, 2 = two days ago — matches the streak grace
  // window, so backfilling can repair a broken chain.
  const [daysBack, setDaysBack] = useState<0 | 1 | 2>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const dayLabel = (n: number): string => {
    if (n === 0) return 'Today';
    if (n === 1) return 'Yesterday';
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

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
      // Every day (incl. today) is anchored at the TRACKING day's midday so
      // the count lands in the right Fajr-boundary bucket for any timezone.
      const d = new Date(getTrackingDayMiddayTs());
      d.setDate(d.getDate() - daysBack);
      const ts = d.getTime();
      await api.post('/api/zikr/increment/batch', {
        increments: [{ zikrType: selectedType, amount: parsedAmount, ts }],
        timezoneOffset: getUserTimezoneOffset(),
        today: getTrackingDay(),
      });
      // Local live counter only reflects TODAY — don't inflate it with backfills
      if (daysBack === 0) addConfirmedCounts(selectedType, parsedAmount);
      // Close IMMEDIATELY — the modal used to await the full analytics
      // refetch here, which made saving feel slow on mobile networks. The
      // refetch happens in the background; the charts catch up on their own.
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success(`+${parsedAmount.toLocaleString()} ${selectedType} logged for ${dayLabel(daysBack).toLowerCase()} 📿`, { id: 'zikr-backfill' });
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

  // Portaled to <body>: rendering inside the page's transformed/animated
  // ancestors created a stacking context that let the sticky navbar float
  // OVER the form. max-h + scroll keep it usable with the keyboard open.
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="bg-brand-surface rounded-3xl w-full max-w-md shadow-2xl border border-brand-border overflow-hidden max-h-[88vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-brand-border/60">
          <div>
            <h3 className="text-lg font-black text-brand-emerald">Log Missed Counts</h3>
            <p className="text-white/30 text-xs mt-0.5">Add zikr you counted outside the app today</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!showAddNew ? (
            <>
              {/* Which day — today or up to 2 days back (streak grace window) */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 uppercase tracking-wider font-bold">Which day?</label>
                <div className="flex gap-1.5">
                  {([0, 1, 2] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => { setDaysBack(n); setSubmitError(''); }}
                      className={`flex-1 px-2 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        daysBack === n
                          ? 'bg-brand-emerald/20 border-brand-emerald/60 text-brand-emerald'
                          : 'bg-brand-deep border-brand-border text-white/40 hover:text-white/70'
                      }`}
                    >
                      {dayLabel(n)}
                    </button>
                  ))}
                </div>
                {daysBack > 0 && (
                  <p className="text-brand-info/70 text-[11px]">
                    🧊 Backfilling a missed day can restore your streak — the grace window covers up to 2 days back.
                  </p>
                )}
              </div>

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

              {/* Amount FIRST (Istiak: type → save, fastest path), context after */}
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

              {/* Today's existing count (only meaningful for today) */}
              {daysBack === 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-brand-emerald/10">
                  <span className="text-white/50 text-sm">Today's count so far</span>
                  <span className="text-white font-black text-lg tabular-nums">{existingCount.toLocaleString()}</span>
                </div>
              )}

              {/* Total preview */}
              {parsedAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30"
                >
                  {daysBack === 0 ? (
                    <>
                      <span className="text-brand-emerald/80 text-sm font-semibold">
                        {existingCount.toLocaleString()} + {parsedAmount.toLocaleString()}
                      </span>
                      <span className="text-brand-emerald font-black text-xl tabular-nums">
                        = {newTotal.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-brand-emerald font-bold text-sm">
                      +{parsedAmount.toLocaleString()} will be added to {dayLabel(daysBack)}
                    </span>
                  )}
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
    </motion.div>,
    document.body
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
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
    { label: '1y', value: 365 },
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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Tab navigation */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <TabNav
              items={[
                { label: '📿 Counter', to: '/zikr' },
                { label: '📊 Analytics', to: '/zikr/analytics', active: true },
              ]}
            />

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'All-time', value: allTime?.totalCount?.toLocaleString() ?? '0', accent: 'text-brand-emerald' },
              { label: 'Today', value: todayTotal.toLocaleString(), accent: 'text-brand-gold' },
              {
                label: 'Best day',
                value: allTime?.bestDay?.count?.toLocaleString() ?? '0',
                accent: 'text-brand-info',
                sub: allTime?.bestDay?.date
                  ? new Date(allTime.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : undefined,
              },
              { label: 'Types used', value: allTimeTypes.filter((t) => t.total > 0).length, accent: 'text-brand-warm' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center"
              >
                <p className={`text-2xl font-black ${s.accent}`}>{s.value}</p>
                <p className="text-white/30 text-[10px] font-bold uppercase mt-1">{s.label}</p>
                {s.sub && <p className="text-white/20 text-[10px] mt-0.5">{s.sub}</p>}
              </motion.div>
            ))}
          </div>

          {/* Breakdown by Type */}
          <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-white font-black text-sm flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4 text-brand-emerald" /> Breakdown by Type
              </h2>
              <div className="tabs tabs-boxed tabs-sm bg-brand-surface border border-brand-border">
                {(['today', 'all'] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`tab text-xs ${activeTab === tab ? 'tab-active bg-brand-emerald text-white font-bold' : 'text-white/60'}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'today' ? 'Today' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>

            {displayData?.length ? (
              <div className="space-y-2">
                {displayData.map((t, i) => {
                  const pct = displayTotal > 0 ? (t.total / displayTotal) * 100 : 0;
                  return (
                    <motion.div
                      key={t.zikrType}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/70 text-xs font-bold truncate max-w-[60%]">{t.zikrType}</span>
                        <span className="text-white font-black text-xs tabular-nums">{t.total.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct > 0 ? Math.max(pct, 2) : 0}%` }}
                          transition={{ duration: 0.6, delay: i * 0.03 }}
                          className="h-full rounded-full bg-gradient-to-r from-brand-emerald/80 to-brand-info/80"
                        />
                      </div>
                      <p className="text-white/20 text-[10px] mt-0.5">{pct.toFixed(1)}%</p>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/30 text-sm text-center py-8">
                No zikr recorded yet for {activeTab === 'today' ? 'today' : 'all time'}.
              </p>
            )}
          </div>

          {/* Trend chart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-white font-black text-sm flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4 text-brand-emerald" /> Trend
              </h2>
              <div className="tabs tabs-boxed tabs-sm bg-brand-deep border border-brand-border">
                {periods.map((p) => (
                  <button
                    key={p.value}
                    className={`tab text-xs ${selectedPeriod === p.value ? 'tab-active bg-brand-emerald text-white font-bold' : 'text-white/60'}`}
                    onClick={() => setSelectedPeriod(p.value)}
                  >
                    {p.label}
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
