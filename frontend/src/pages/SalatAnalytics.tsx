import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { ChartBarIcon, FireIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useSalatAnalytics } from '../hooks/useSalatLog.js';
import { PRAYER_META } from '../utils/prayerTimes.js';

const PERIOD_OPTIONS = [
  { label: '7d',  value: 7 },
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
];

const PRAYER_GRADIENTS: Record<string, string> = {
  fajr:    'from-indigo-500 to-blue-600',
  dhuhr:   'from-amber-400 to-orange-500',
  asr:     'from-cyan-500 to-teal-600',
  maghrib: 'from-rose-500 to-pink-600',
  isha:    'from-violet-500 to-purple-600',
};

/** Map 0–5 completed prayers to a CSS background colour.
 *  0 = no data/all missed → muted grey
 *  1-2 = shaded red (bad, but not demoralising bright red)
 *  3   = amber (half-way)
 *  4   = light green
 *  5   = rich dark green
 */
function calendarCellStyle(completed: number, hasData: boolean) {
  if (!hasData) return { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' };
  if (completed === 0) return { background: 'rgba(185,28,28,0.35)',  border: '1px solid rgba(185,28,28,0.4)' };
  if (completed === 1) return { background: 'rgba(185,28,28,0.55)',  border: '1px solid rgba(185,28,28,0.6)' };
  if (completed === 2) return { background: 'rgba(180,83,9,0.55)',   border: '1px solid rgba(180,83,9,0.7)' };
  if (completed === 3) return { background: 'rgba(161,98,7,0.55)',   border: '1px solid rgba(161,98,7,0.7)' };
  if (completed === 4) return { background: 'rgba(6,95,70,0.65)',    border: '1px solid rgba(6,95,70,0.8)' };
  /* 5 */              return { background: 'rgba(16,185,129,0.75)', border: '1px solid rgba(16,185,129,0.9)' };
}

export default function SalatAnalytics() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useSalatAnalytics(days);

  // Group calendar data into weeks (Sun–Sat) for the heatmap
  const calendarWeeks = (() => {
    if (!data?.calendarData) return [];
    const cells = [...data.calendarData];
    // pad front to align first day to correct weekday
    const firstDay = new Date(cells[0].date + 'T12:00:00').getDay(); // 0=Sun
    const padded: (typeof cells[number] | null)[] = Array(firstDay).fill(null).concat(cells);
    const weeks: (typeof cells[number] | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }
    return weeks;
  })();

  // Month labels for heatmap
  const monthLabels = (() => {
    if (!data?.calendarData) return [];
    const labels: { label: string; weekIdx: number }[] = [];
    let lastMonth = -1;
    data.calendarData.forEach((d, i) => {
      const weekIdx = Math.floor(i / 7);
      const month = new Date(d.date + 'T12:00:00').getMonth();
      if (month !== lastMonth) {
        labels.push({ label: new Date(d.date + 'T12:00:00').toLocaleString('en-US', { month: 'short' }), weekIdx });
        lastMonth = month;
      }
    });
    return labels;
  })();

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Tab navigation — mirrors SalatTracker */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 max-w-xs">
            <Link
              to="/salat"
              className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all"
            >
              🕌 Tracker
            </Link>
            <span className="flex-1 text-center text-xs font-bold py-1.5 rounded-lg bg-white/10 text-white">
              📊 Analytics
            </span>
          </div>

          {/* Title + period selector on the same row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl font-black text-brand-emerald flex items-center gap-3">
              <ChartBarIcon className="w-8 h-8" /> Salat Analytics
            </motion.h1>
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
              {/* Period note */}
              {data.totalDays < data.periodDays && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-brand-surface border border-brand-border text-xs text-white/40">
                  <InformationCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-white/30" />
                  <span>
                    <span className="text-white/60 font-semibold">{data.totalDays} of {data.periodDays} days</span> have logged prayers in this period.
                    The completion rate is calculated over <span className="text-white/60">days with actual entries</span>, not the full calendar period.
                    Days you didn't open the app are not counted against you.
                  </span>
                </div>
              )}

              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Completion',
                    value: `${data.completionRate}%`,
                    sub: `(Done + Kaza) ÷ (${data.totalDays} tracked days × 5) × 100`,
                    gradient: 'from-brand-emerald to-cyan-400',
                    tooltip: true,
                  },
                  {
                    label: 'Current Streak',
                    value: data.currentStreak,
                    sub: 'Consecutive days with all 5 prayers (done or kaza)',
                    gradient: 'from-brand-gold to-orange-400',
                    icon: <FireIcon className="w-3 h-3 inline" />,
                  },
                  {
                    label: 'Best Streak',
                    value: data.bestStreak,
                    sub: 'Longest run of all-5-prayer days ever',
                    gradient: 'from-violet-500 to-purple-400',
                  },
                  {
                    label: 'Nafl Days',
                    value: data.naflDays ?? 0,
                    sub: 'Days with at least one nafl prayer logged',
                    gradient: 'from-cyan-500 to-teal-400',
                  },
                ].map(({ label, value, sub, gradient, icon, tooltip }) => (
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
                        {tooltip && <InformationCircleIcon className="w-3 h-3 text-white/20" />}
                      </p>
                      <p className={`text-4xl font-black bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>{value}</p>
                      <p className="text-white/25 text-xs mt-1 leading-tight">{sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Breakdown strip */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="card bg-brand-surface border border-brand-border rounded-2xl"
              >
                <div className="card-body p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Overall Breakdown</h2>
                    <span className="text-white/25 text-xs">{data.totalDays} days × 5 prayers = {data.totalPossiblePrayers} total</span>
                  </div>
                  <div className="w-full h-4 rounded-full overflow-hidden flex bg-white/10">
                    {data.totalPossiblePrayers > 0 && (
                      <>
                        {[
                          { count: data.completedCount, color: 'bg-brand-emerald', tip: 'On time' },
                          { count: data.kazaCount,      color: 'bg-brand-gold',    tip: 'Kaza' },
                          { count: data.missedCount,    color: 'bg-red-600/70',    tip: 'Missed' },
                        ].map(({ count, color, tip }) => (
                          <motion.div
                            key={tip}
                            title={`${tip}: ${count}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / data.totalPossiblePrayers) * 100}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full ${color}`}
                          />
                        ))}
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    {[
                      { label: 'On time', count: data.completedCount, color: 'bg-brand-emerald' },
                      { label: 'Kaza',    count: data.kazaCount,      color: 'bg-brand-gold' },
                      { label: 'Missed',  count: data.missedCount,    color: 'bg-red-600/70' },
                      { label: 'Mosque',  count: data.mosqueCount,    color: 'bg-cyan-400' },
                      { label: 'Jamat',   count: data.jamaatCount,    color: 'bg-teal-400' },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                        <span className="text-white/50">{label}</span>
                        <span className="text-white font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-0.5 pt-1 border-t border-white/10">
                    <p className="text-white/20 text-xs flex items-center gap-1">
                      <InformationCircleIcon className="w-3 h-3 shrink-0" />
                      Completion = (On time + Kaza) ÷ ({data.totalDays} × 5) × 100 = <strong className="text-white/30">{data.completionRate}%</strong>
                    </p>
                    <p className="text-white/20 text-xs flex items-center gap-1">
                      <InformationCircleIcon className="w-3 h-3 shrink-0" />
                      Mosque = prayers specifically at a mosque; Jamat = in congregation (anywhere)
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Per-prayer cards */}
              <div className="space-y-3">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-brand-emerald" /> Per Prayer
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PRAYER_META.filter((p) => p.isTrackable).map((prayer, i) => {
                    const stats = data.perPrayer[prayer.id] ?? { completed: 0, kaza: 0, missed: 0, pending: 0, mosque: 0, jamat: 0, tasbeeh: 0 };
                    const total = data.totalDays;
                    const done = stats.completed + stats.kaza;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    const gradient = PRAYER_GRADIENTS[prayer.id] ?? 'from-gray-500 to-gray-600';
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
                        <div className="card-body p-4 relative z-10">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{prayer.icon}</span>
                            <h3 className="font-black text-white text-base">{prayer.name}</h3>
                          </div>
                          <div className="text-3xl font-black text-white mb-0.5">{pct}%</div>
                          <p className="text-white/40 text-xs mb-1.5">
                            ({done} prayed ÷ {total} days) × 100
                          </p>
                          <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: 0.05 * i }}
                              className="h-full bg-white rounded-full"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-0.5 text-xs text-white/80">
                            <span>✅ {stats.completed} on time</span>
                            <span>⏰ {stats.kaza} kaza</span>
                            <span>❌ {stats.missed} missed</span>
                            <span>🕌 {stats.mosque} mosque</span>
                            {stats.tasbeeh > 0 && <span className="col-span-2">📿 {stats.tasbeeh}× tasbeeh</span>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* GitHub-style calendar heatmap */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-black text-white">Prayer Calendar</h2>
                  <span className="text-white/30 text-xs">last {data.calendarData.length} days</span>
                </div>

                <div className="card bg-brand-surface border border-brand-border rounded-2xl overflow-x-auto">
                  <div className="p-4 min-w-[500px]">
                    {/* Weekday labels */}
                    <div className="flex gap-1.5 mb-1 pl-[38px]">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="w-[18px] text-center text-white/20 text-xs">{d}</div>
                      ))}
                    </div>

                    <div className="flex gap-1.5">
                      {/* Month labels on left */}
                      <div className="flex flex-col gap-1.5 w-8 shrink-0">
                        {calendarWeeks.map((_, wi) => {
                          const ml = monthLabels.find((m) => m.weekIdx === wi);
                          return (
                            <div key={wi} className="h-[18px] flex items-center">
                              {ml ? <span className="text-white/30 text-xs leading-none">{ml.label}</span> : null}
                            </div>
                          );
                        })}
                      </div>

                      {/* Grid: weeks as rows, days (Sun-Sat) as columns */}
                      <div className="flex flex-col gap-1.5">
                        {calendarWeeks.map((week, wi) => (
                          <div key={wi} className="flex gap-1.5">
                            {week.map((cell, di) => {
                              if (!cell) return <div key={di} className="w-[18px] h-[18px] rounded-sm" />;
                              const hasData = cell.completed > 0 || data.calendarData.some(
                                (c) => c.date === cell.date && c.completed === 0
                              );
                              const isActuallyLogged = data.calendarData.some((c) => c.date === cell.date);
                              const cellStyle = calendarCellStyle(cell.completed, isActuallyLogged);
                              return (
                                <div
                                  key={di}
                                  className="tooltip"
                                  data-tip={`${cell.date}: ${cell.completed}/5 prayers`}
                                >
                                  <div
                                    className="w-[18px] h-[18px] rounded-sm"
                                    style={cellStyle}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-2 mt-3 pl-[38px]">
                      <span className="text-white/25 text-xs">Less</span>
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className="w-[18px] h-[18px] rounded-sm" style={calendarCellStyle(n, n > 0 || n === 0)} />
                      ))}
                      <span className="text-white/25 text-xs">More</span>
                      <span className="text-white/20 text-xs ml-2">(prayers/day)</span>
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}
