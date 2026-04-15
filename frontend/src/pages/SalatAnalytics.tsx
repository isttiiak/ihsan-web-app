import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { ArrowLeftIcon, ChartBarIcon, FireIcon } from '@heroicons/react/24/outline';
import { useSalatAnalytics } from '../hooks/useSalatLog.js';
import { PRAYER_META } from '../utils/prayerTimes.js';

const PERIOD_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '60 Days', value: 60 },
  { label: '90 Days', value: 90 },
];

const PRAYER_COLORS: Record<string, string> = {
  fajr:    'from-indigo-500 to-blue-600',
  dhuhr:   'from-amber-400 to-orange-500',
  asr:     'from-cyan-500 to-teal-600',
  maghrib: 'from-rose-500 to-pink-600',
  isha:    'from-violet-500 to-purple-600',
};

export default function SalatAnalytics() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useSalatAnalytics(days);

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Back */}
          <div className="flex items-center justify-between">
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-surface/90 backdrop-blur-md border border-brand-border text-white text-sm font-semibold shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <ArrowLeftIcon className="w-4 h-4" /> Back
            </motion.button>
            <div className="tabs tabs-boxed bg-brand-deep border border-brand-border">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  className={`tab text-xs ${days === p.value ? 'tab-active bg-brand-emerald text-white font-bold' : 'text-white/60'}`}
                  onClick={() => setDays(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Header */}
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-black text-brand-emerald flex items-center gap-3"
          >
            <ChartBarIcon className="w-8 h-8" /> Salat Analytics
          </motion.h1>

          {isLoading && (
            <div className="flex justify-center py-20">
              <span className="loading loading-spinner loading-lg text-brand-emerald" />
            </div>
          )}

          {isError && (
            <div className="card bg-brand-surface border border-brand-border rounded-2xl">
              <div className="card-body text-center p-10">
                <p className="text-white/50">Could not load analytics. Please try again.</p>
              </div>
            </div>
          )}

          {data && !isLoading && (
            <>
              {/* Streak + completion rate */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Completion', value: `${data.completionRate}%`, sub: 'Prayed + Mosque', gradient: 'from-brand-emerald to-cyan-400' },
                  { label: 'Streak', value: data.currentStreak, sub: 'Current days', gradient: 'from-brand-gold to-orange-400', icon: <FireIcon className="w-4 h-4" /> },
                  { label: 'Best Streak', value: data.bestStreak, sub: 'All-time days', gradient: 'from-violet-500 to-purple-400' },
                  { label: 'Days Tracked', value: data.totalDays, sub: `Last ${days} days`, gradient: 'from-brand-magenta to-rose-400' },
                ].map(({ label, value, sub, gradient, icon }) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="card bg-brand-surface border border-brand-border rounded-2xl"
                  >
                    <div className="card-body p-4">
                      <p className={`text-xs font-bold uppercase tracking-wide bg-gradient-to-r ${gradient} bg-clip-text text-transparent flex items-center gap-1`}>
                        {icon}{label}
                      </p>
                      <p className={`text-4xl font-black bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>{value}</p>
                      <p className="text-white/30 text-xs mt-1">{sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Breakdown bar */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="card bg-brand-surface border border-brand-border rounded-2xl"
              >
                <div className="card-body p-5 space-y-4">
                  <h2 className="text-lg font-bold text-white">Overall Breakdown</h2>
                  <div className="w-full h-5 rounded-full overflow-hidden flex bg-white/10">
                    {data.totalPrayers > 0 && (
                      <>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(data.prayedCount / data.totalPrayers) * 100}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full bg-brand-emerald"
                          title={`Prayed: ${data.prayedCount}`}
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(data.mosqueCount / data.totalPrayers) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.1 }}
                          className="h-full bg-cyan-400"
                          title={`Mosque: ${data.mosqueCount}`}
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(data.kazaCount / data.totalPrayers) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full bg-brand-gold"
                          title={`Kaza: ${data.kazaCount}`}
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(data.missedCount / data.totalPrayers) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className="h-full bg-red-500"
                          title={`Missed: ${data.missedCount}`}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {[
                      { label: 'Prayed', count: data.prayedCount, color: 'bg-brand-emerald' },
                      { label: 'Mosque', count: data.mosqueCount, color: 'bg-cyan-400' },
                      { label: 'Kaza', count: data.kazaCount, color: 'bg-brand-gold' },
                      { label: 'Missed', count: data.missedCount, color: 'bg-red-500' },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${color}`} />
                        <span className="text-white/60">{label}</span>
                        <span className="text-white font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Per-prayer breakdown */}
              <div className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-brand-emerald" /> Per Prayer
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PRAYER_META.filter((p) => p.isTrackable).map((prayer, i) => {
                    const stats = data.perPrayer[prayer.id] ?? { prayed: 0, mosque: 0, kaza: 0, missed: 0 };
                    const total = data.totalDays;
                    const done = stats.prayed + stats.mosque;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    const gradient = PRAYER_COLORS[prayer.id] ?? 'from-gray-500 to-gray-600';
                    return (
                      <motion.div
                        key={prayer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`card relative overflow-hidden bg-gradient-to-br ${gradient} border border-white/20 rounded-2xl`}
                      >
                        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.5 }} />
                        <div className="card-body p-5 relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{prayer.icon}</span>
                            <h3 className="font-black text-white text-lg">{prayer.name}</h3>
                          </div>
                          <div className="text-4xl font-black text-white mb-1">{pct}%</div>
                          <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, delay: 0.1 * i }}
                              className="h-full bg-white rounded-full"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-white/80">
                            <span>✅ {stats.prayed} prayed</span>
                            <span>🕌 {stats.mosque} mosque</span>
                            <span>⏰ {stats.kaza} kaza</span>
                            <span>❌ {stats.missed} missed</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Last 7 days heatmap */}
              <div className="space-y-3">
                <h2 className="text-xl font-black text-white">Last 7 Days</h2>
                <div className="grid grid-cols-7 gap-2">
                  {data.last7Days.map((day, i) => {
                    const pct = day.completed / day.total;
                    const d = new Date(day.date + 'T00:00:00');
                    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * i }}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-full aspect-square rounded-xl flex items-center justify-center text-sm font-black text-white"
                          style={{
                            background: pct === 0
                              ? 'rgba(255,255,255,0.05)'
                              : `rgba(16,185,129,${0.2 + pct * 0.7})`,
                            border: `1px solid rgba(16,185,129,${pct * 0.5})`,
                          }}
                        >
                          {day.completed}
                        </div>
                        <span className="text-white/40 text-xs">{label}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}
