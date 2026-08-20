import { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import TabNav from '../components/TabNav.js';
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
  fajr:    'from-brand-info to-brand-info-dim',
  dhuhr:   'from-brand-gold to-brand-warm',
  asr:     'from-brand-info to-brand-info-dim',
  maghrib: 'from-brand-pink to-brand-pink-dim',
  isha:    'from-brand-info to-brand-info-dim',
};

function calendarCellStyle(completed: number, hasData: boolean) {
  if (!hasData) return { background: 'rgba(122,158,110,0.04)', border: '1px solid rgba(122,158,110,0.08)' };
  if (completed === 0) return { background: 'rgba(185,28,28,0.30)', border: '1px solid rgba(185,28,28,0.40)' };
  if (completed === 1) return { background: 'rgba(196,130,90,0.35)', border: '1px solid rgba(196,130,90,0.45)' };
  if (completed === 2) return { background: 'rgba(201,169,110,0.35)', border: '1px solid rgba(201,169,110,0.45)' };
  if (completed === 3) return { background: 'rgba(201,169,110,0.55)', border: '1px solid rgba(201,169,110,0.60)' };
  if (completed === 4) return { background: 'rgba(122,158,110,0.45)', border: '1px solid rgba(122,158,110,0.55)' };
  return { background: 'rgba(122,158,110,0.75)', border: '1px solid rgba(122,158,110,0.85)' };
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

  const todayStr = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Tab navigation — mirrors SalatTracker */}
          <TabNav
            items={[
              { label: '🕌 Tracker', to: '/salat' },
              { label: '📊 Analytics', to: '/salat/analytics', active: true },
            ]}
          />

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
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20">
                  <span className="text-lg shrink-0">📅</span>
                  <p className="text-sm text-white/50">
                    Active on <span className="text-brand-emerald font-semibold">{data.totalDays}</span> of {data.periodDays} days — stats reflect your tracked days only.
                  </p>
                </div>
              )}

              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Completion',
                    value: `${data.completionRate}%`,
                    sub: `(Done + Kaza) ÷ (${data.totalDays} tracked days × 5) × 100`,
                    gradient: 'from-brand-emerald to-brand-info',
                    tooltip: true,
                  },
                  {
                    label: 'Days without a gap',
                    value: data.currentStreak,
                    sub: 'How long you have prayed all 5, day after day',
                    gradient: 'from-brand-gold to-brand-warm',
                    icon: <FireIcon className="w-3 h-3 inline" />,
                  },
                  {
                    label: 'Best run',
                    value: data.bestStreak,
                    sub: 'Your longest run of all-5-prayer days',
                    gradient: 'from-brand-info to-brand-info',
                  },
                  {
                    label: 'Nafl Days',
                    value: data.naflDays ?? 0,
                    sub: 'Days with at least one nafl prayer logged',
                    gradient: 'from-brand-info to-brand-info',
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
                      { label: 'Mosque',  count: data.mosqueCount,    color: 'bg-brand-info' },
                      { label: 'Jamat',   count: data.jamaatCount,    color: 'bg-brand-info' },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                        <span className="text-white/50">{label}</span>
                        <span className="text-white font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-0.5 pt-1 border-t border-brand-emerald/10">
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
                    const gradient = PRAYER_GRADIENTS[prayer.id] ?? 'from-white to-brand-border';
                    return (
                      <motion.div
                        key={prayer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`card relative overflow-hidden bg-gradient-to-br ${gradient} border border-brand-emerald/20 rounded-2xl`}
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

              {/* Prayer Calendar */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-black text-white">Prayer Calendar</h2>
                  <span className="text-white/30 text-xs">last {data.calendarData.length} days</span>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card bg-brand-surface border border-brand-border rounded-2xl overflow-x-auto"
                >
                  <div className="p-5 min-w-[540px]">
                    {/* Day headers */}
                    <div className="flex gap-1 mb-2 pl-10">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                        <div key={i} className={`w-7 text-center text-[11px] ${i === 5 ? 'text-brand-emerald/60 font-semibold' : 'text-white/25'}`}>{d}</div>
                      ))}
                    </div>

                    <div className="flex gap-1">
                      {/* Month labels */}
                      <div className="flex flex-col gap-1 w-9 shrink-0">
                        {calendarWeeks.map((_, wi) => {
                          const ml = monthLabels.find((m) => m.weekIdx === wi);
                          return (
                            <div key={wi} className="h-7 flex items-center">
                              {ml ? <span className="text-white/30 text-xs leading-none">{ml.label}</span> : null}
                            </div>
                          );
                        })}
                      </div>

                      {/* Grid */}
                      <div className="flex flex-col gap-1">
                        {calendarWeeks.map((week, wi) => (
                          <div key={wi} className="flex gap-1">
                            {week.map((cell, di) => {
                              if (!cell) return <div key={di} className="w-7 h-7" />;
                              const isLogged = data.calendarData.some((c) => c.date === cell.date);
                              const isPerfect = cell.completed === 5;
                              const isToday = cell.date === todayStr;
                              return (
                                <motion.div
                                  key={di}
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: (wi * 7 + di) * 0.006, duration: 0.25 }}
                                  className="tooltip cursor-default"
                                  data-tip={`${cell.date}: ${cell.completed}/5`}
                                >
                                  <div
                                    className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold transition-transform hover:scale-110 ${
                                      isToday ? 'ring-2 ring-brand-emerald ring-offset-1 ring-offset-brand-surface' : ''
                                    }`}
                                    style={{
                                      ...calendarCellStyle(cell.completed, isLogged),
                                      ...(isPerfect ? { boxShadow: '0 0 8px rgba(122,158,110,0.35)' } : {}),
                                    }}
                                  >
                                    {isLogged && (
                                      <span className={isPerfect ? 'text-white' : cell.completed >= 3 ? 'text-white/80' : cell.completed > 0 ? 'text-white/60' : 'text-white/40'}>
                                        {cell.completed}
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-1.5 mt-4 pl-10 flex-wrap">
                      <span className="text-white/25 text-xs mr-1">Less</span>
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white/50"
                          style={calendarCellStyle(n, true)}>
                          {n}
                        </div>
                      ))}
                      <span className="text-white/25 text-xs ml-1">More</span>
                      <span className="text-white/20 text-xs ml-2">prayers / day</span>
                    </div>
                  </div>
                </motion.div>
              </div>

            </>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}
