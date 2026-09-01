import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import TabNav from '../components/TabNav.js';
import { ChartBarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useSalatAnalytics } from '../hooks/useSalatLog.js';
import { PRAYER_META } from '../utils/prayerTimes.js';

const PERIOD_OPTIONS = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1y',  value: 365 },
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
  const { t, i18n } = useTranslation();
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useSalatAnalytics(days);

  // Group calendar data into weeks (Fri–Thu, Islamic week) for the heatmap
  const calendarWeeks = (() => {
    if (!data?.calendarData) return [];
    const cells = [...data.calendarData];
    const jsDay = new Date(cells[0].date + 'T12:00:00').getDay(); // 0=Sun
    const firstDay = (jsDay + 2) % 7; // Fri=0, Sat=1, ..., Thu=6
    const padded: (typeof cells[number] | null)[] = Array(firstDay).fill(null).concat(cells);
    const weeks: (typeof cells[number] | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }
    return weeks;
  })();

  // Month labels for heatmap (account for front-padding in calendarWeeks)
  const monthLabels = (() => {
    if (!data?.calendarData) return [];
    const labels: { label: string; weekIdx: number }[] = [];
    let lastMonth = -1;
    const jsDay = new Date(data.calendarData[0].date + 'T12:00:00').getDay();
    const firstDay = (jsDay + 2) % 7;
    data.calendarData.forEach((d, i) => {
      const paddedIdx = firstDay + i;
      const weekIdx = Math.floor(paddedIdx / 7);
      const month = new Date(d.date + 'T12:00:00').getMonth();
      if (month !== lastMonth) {
        labels.push({ label: new Date(d.date + 'T12:00:00').toLocaleString(i18n.language, { month: 'short' }), weekIdx });
        lastMonth = month;
      }
    });
    return labels;
  })();

  const todayStr = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();

  const DAY_LABELS = [
    t('salatAnalytics.dayFri'),
    t('salatAnalytics.daySat'),
    t('salatAnalytics.daySun'),
    t('salatAnalytics.dayMon'),
    t('salatAnalytics.dayTue'),
    t('salatAnalytics.dayWed'),
    t('salatAnalytics.dayThu'),
  ];

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Tab navigation — mirrors SalatTracker */}
          <TabNav
            items={[
              { label: `🕌 ${t('salat.tracker')}`, to: '/salat' },
              { label: `📊 ${t('salat.analytics')}`, to: '/salat/analytics', active: true },
            ]}
          />

          {/* Title + period selector */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-white font-black text-sm flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 text-brand-emerald" /> {t('salatAnalytics.title')}
            </h1>
            <div className="tabs tabs-boxed tabs-sm bg-brand-deep border border-brand-border">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  className={`tab text-xs ${days === p.value ? 'tab-active bg-brand-emerald text-white font-bold' : 'text-white/60'}`}
                  onClick={() => setDays(p.value)}
                >
                  {t(`salatAnalytics.period${p.value}`)}
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
                <p className="text-white/50">{t('salatAnalytics.loadError')}</p>
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
                    {t('salatAnalytics.periodNoteStart', { total: data.periodDays })} <span className="text-brand-emerald font-semibold">{data.totalDays}</span> {t('salatAnalytics.periodNoteEnd', { total: data.periodDays })}
                  </p>
                </div>
              )}

              {/* Stat tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t('salatAnalytics.completion'), value: `${data.completionRate}%`, accent: 'text-brand-emerald' },
                  { label: t('salatAnalytics.currentStreak'), value: data.currentStreak, accent: 'text-brand-gold' },
                  { label: t('salatAnalytics.bestRun'), value: data.bestStreak, accent: 'text-brand-info' },
                  { label: t('salatAnalytics.naflDays'), value: data.naflDays ?? 0, accent: 'text-brand-warm' },
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
                  </motion.div>
                ))}
              </div>

              {/* Breakdown strip */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-brand-deep/80 border border-brand-border"
              >
                <div className="card-body p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{t('salatAnalytics.overallBreakdown')}</h2>
                    <span className="text-white/25 text-xs">{t('salatAnalytics.totalSummary', { days: data.totalDays, total: data.totalPossiblePrayers })}</span>
                  </div>
                  <div className="w-full h-4 rounded-full overflow-hidden flex bg-white/10">
                    {data.totalPossiblePrayers > 0 && (
                      <>
                        {[
                          { count: data.completedCount, color: 'bg-brand-emerald', tip: t('salatAnalytics.onTime') },
                          { count: data.kazaCount,      color: 'bg-brand-gold',    tip: t('salatAnalytics.kaza') },
                          { count: data.missedCount,    color: 'bg-red-600/70',    tip: t('salatAnalytics.missed') },
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
                      { label: t('salatAnalytics.onTime'), count: data.completedCount, color: 'bg-brand-emerald' },
                      { label: t('salatAnalytics.kaza'),    count: data.kazaCount,      color: 'bg-brand-gold' },
                      { label: t('salatAnalytics.missed'),  count: data.missedCount,    color: 'bg-red-600/70' },
                      { label: t('salatAnalytics.mosque'),  count: data.mosqueCount,    color: 'bg-brand-info' },
                      { label: t('salatAnalytics.jamat'),   count: data.jamaatCount,    color: 'bg-brand-info' },
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
                      {t('salatAnalytics.completionFormula', { days: data.totalDays })} <strong className="text-white/30">{data.completionRate}%</strong>
                    </p>
                    <p className="text-white/20 text-xs flex items-center gap-1">
                      <InformationCircleIcon className="w-3 h-3 shrink-0" />
                      {t('salatAnalytics.mosqueJamatNote')}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Per-prayer cards */}
              <div className="space-y-3">
                <h2 className="text-white font-black text-sm flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-brand-emerald" /> {t('salatAnalytics.perPrayer')}
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i }}
                        className={`card bg-gradient-to-br ${gradient} border border-brand-emerald/20 rounded-2xl`}
                      >
                        <div className="card-body p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{prayer.icon}</span>
                            <h3 className="font-black text-white text-base">{t(`salatAnalytics.prayerName.${prayer.id}`)}</h3>
                          </div>
                          <div className="text-3xl font-black text-white mb-0.5">{pct}%</div>
                          <p className="text-white/40 text-xs mb-1.5">
                            {t('salatAnalytics.prayedFormula', { done, total })}
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
                            <span>✅ {t('salatAnalytics.onTimeStat', { count: stats.completed })}</span>
                            <span>⏰ {t('salatAnalytics.kazaStat', { count: stats.kaza })}</span>
                            <span>❌ {t('salatAnalytics.missedStat', { count: stats.missed })}</span>
                            <span>🕌 {t('salatAnalytics.mosqueStat', { count: stats.mosque })}</span>
                            {stats.tasbeeh > 0 && <span className="col-span-2">📿 {t('salatAnalytics.tasbeehStat', { count: stats.tasbeeh })}</span>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Prayer Calendar — horizontal (weeks flow left→right, days top→bottom) */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-white font-black text-sm">{t('salatAnalytics.prayerCalendar')}</h2>
                  <span className="text-white/25 text-xs">{t('salatAnalytics.lastDays', { count: data.calendarData.length })}</span>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card bg-brand-surface border border-brand-border rounded-2xl overflow-x-auto"
                >
                  <div className="p-5">
                    {/* Month labels across the top */}
                    <div className="flex gap-1 mb-1.5 pl-10">
                      {calendarWeeks.map((_, wi) => {
                        const ml = monthLabels.find((m) => m.weekIdx === wi);
                        return (
                          <div key={wi} className="w-7 text-center shrink-0">
                            {ml ? <span className="text-white/30 text-[10px] leading-none">{ml.label}</span> : null}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-1">
                      {/* Day-of-week labels on the left (Islamic week: Fri→Thu) */}
                      <div className="flex flex-col gap-1 w-9 shrink-0">
                        {DAY_LABELS.map((d, i) => (
                          <div key={i} className={`h-7 flex items-center text-[11px] ${i === 0 ? 'text-brand-emerald/60 font-semibold' : 'text-white/25'}`}>
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Grid: each column = one week, rows = days of week */}
                      <div className="flex gap-1">
                        {calendarWeeks.map((week, wi) => (
                          <div key={wi} className="flex flex-col gap-1">
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
                                  transition={{ delay: (wi + di * calendarWeeks.length) * 0.004, duration: 0.25 }}
                                  className="tooltip cursor-default"
                                  data-tip={t('salatAnalytics.calendarTip', { date: cell.date, completed: cell.completed })}
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
                      <span className="text-white/25 text-xs mr-1">{t('salatAnalytics.less')}</span>
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white/50"
                          style={calendarCellStyle(n, true)}>
                          {n}
                        </div>
                      ))}
                      <span className="text-white/25 text-xs ml-1">{t('salatAnalytics.more')}</span>
                      <span className="text-white/20 text-xs ml-2">{t('salatAnalytics.prayersPerDay')}</span>
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
