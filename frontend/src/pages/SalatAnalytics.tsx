import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import TabNav from '../components/TabNav.js';
import DemoSignInGate from '../components/DemoSignInGate.js';
import { useAuthStore } from '../store/useAuthStore.js';
import {
  ChartBarIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import {
  useSalatAnalytics,
  useSalatDebt,
  useSalatDebtHistory,
  useSalatJourney,
} from '../hooks/useSalatLog.js';
import { PRAYER_META } from '../utils/prayerTimes.js';
import { formatLocaleDate, formatLocaleNumber } from '../utils/localeDate.js';

const PERIOD_OPTIONS = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1y', value: 365 },
];

interface MonthSel {
  year: number;
  month: number;
} // 1-based month

const PRAYER_GRADIENTS: Record<string, string> = {
  fajr: 'from-brand-info to-brand-info-dim',
  dhuhr: 'from-brand-gold to-brand-warm',
  asr: 'from-brand-info to-brand-info-dim',
  maghrib: 'from-brand-pink to-brand-pink-dim',
  isha: 'from-brand-info to-brand-info-dim',
};

function calendarCellStyle(completed: number, hasData: boolean) {
  if (!hasData)
    return { background: 'rgba(122,158,110,0.04)', border: '1px solid rgba(122,158,110,0.08)' };
  if (completed === 0)
    return { background: 'rgba(185,28,28,0.30)', border: '1px solid rgba(185,28,28,0.40)' };
  if (completed === 1)
    return { background: 'rgba(196,130,90,0.35)', border: '1px solid rgba(196,130,90,0.45)' };
  if (completed === 2)
    return { background: 'rgba(201,169,110,0.35)', border: '1px solid rgba(201,169,110,0.45)' };
  if (completed === 3)
    return { background: 'rgba(201,169,110,0.55)', border: '1px solid rgba(201,169,110,0.60)' };
  if (completed === 4)
    return { background: 'rgba(122,158,110,0.45)', border: '1px solid rgba(122,158,110,0.55)' };
  return { background: 'rgba(122,158,110,0.75)', border: '1px solid rgba(122,158,110,0.85)' };
}

export default function SalatAnalytics() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const [days, setDays] = useState(30);
  // null = use the period selector; otherwise a specific calendar month
  const [selectedMonth, setSelectedMonth] = useState<MonthSel | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());

  const civilToday = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();

  // When a calendar month is selected, derive days + todayOverride so the
  // analytics endpoint returns exactly that month's data.
  const { analyticsDays, analyticsToday } = useMemo(() => {
    if (!selectedMonth) return { analyticsDays: days, analyticsToday: undefined };
    const { year, month } = selectedMonth;
    const daysInMonth = new Date(year, month, 0).getDate();
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    const today = civilToday;
    const isCurrentMonth = today.startsWith(`${year}-${String(month).padStart(2, '0')}`);
    return {
      analyticsDays: isCurrentMonth
        ? parseInt(today.slice(8), 10) // days elapsed so far this month
        : daysInMonth,
      analyticsToday: isCurrentMonth ? today : lastDay,
    };
  }, [selectedMonth, days, civilToday]);

  const [activeView, setActiveView] = useState<'stats' | 'journey'>('stats');

  const { data, isLoading, isError } = useSalatAnalytics(analyticsDays, analyticsToday);
  const { data: debt } = useSalatDebt();
  const { data: debtHistory } = useSalatDebtHistory(analyticsDays);
  const { data: journeyPhases, isLoading: journeyLoading } = useSalatJourney(civilToday);

  // Group calendar data into weeks (Fri–Thu, Islamic week) for the heatmap
  const calendarWeeks = (() => {
    if (!data?.calendarData?.length) return [];
    const cells = [...data.calendarData];
    const jsDay = new Date(cells[0].date + 'T12:00:00').getDay(); // 0=Sun
    const firstDay = (jsDay + 2) % 7; // Fri=0, Sat=1, ..., Thu=6
    const padded: ((typeof cells)[number] | null)[] = Array(firstDay).fill(null).concat(cells);
    const weeks: ((typeof cells)[number] | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }
    return weeks;
  })();

  // Month labels for heatmap (account for front-padding in calendarWeeks)
  const monthLabels = (() => {
    if (!data?.calendarData?.length) return [];
    const labels: { label: string; weekIdx: number }[] = [];
    let lastMonth = -1;
    const jsDay = new Date(data.calendarData[0].date + 'T12:00:00').getDay();
    const firstDay = (jsDay + 2) % 7;
    data.calendarData.forEach((d, i) => {
      const paddedIdx = firstDay + i;
      const weekIdx = Math.floor(paddedIdx / 7);
      const month = new Date(d.date + 'T12:00:00').getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: formatLocaleDate(new Date(d.date + 'T12:00:00'), { month: 'short' }),
          weekIdx,
        });
        lastMonth = month;
      }
    });
    return labels;
  })();

  const todayStr = civilToday;

  const DAY_LABELS = [
    t('salatAnalytics.dayFri'),
    t('salatAnalytics.daySat'),
    t('salatAnalytics.daySun'),
    t('salatAnalytics.dayMon'),
    t('salatAnalytics.dayTue'),
    t('salatAnalytics.dayWed'),
    t('salatAnalytics.dayThu'),
  ];

  if (isDemoMode) {
    return (
      <DemoSignInGate
        emoji="📊"
        title={t('demoGate.analyticsTitle', 'Your personal analytics await')}
        desc={t(
          'demoGate.salatDesc',
          'Your prayer log, streaks, and debt history are saved to your account.'
        )}
        backTo="/salat"
        backLabel={t('demoGate.backToSalat', 'Back to salat tracker')}
        tabs={
          <TabNav
            items={[
              { label: `🕌 ${t('salat.tracker')}`, to: '/salat' },
              { label: `📊 ${t('salat.analytics')}`, to: '/salat/analytics', active: true },
            ]}
          />
        }
      />
    );
  }

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

          {/* Title + view toggle + period selector */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-white font-black text-sm flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4 text-brand-emerald" /> {t('salatAnalytics.title')}
              </h1>
              <div className="tabs tabs-boxed tabs-sm bg-brand-deep border border-brand-border">
                <button
                  className={`tab text-xs ${activeView === 'stats' ? 'tab-active bg-brand-emerald text-white font-bold' : 'text-white/60'}`}
                  onClick={() => setActiveView('stats')}
                >
                  {t('salatAnalytics.viewStats', 'Stats')}
                </button>
                <button
                  className={`tab text-xs flex items-center gap-1 ${activeView === 'journey' ? 'tab-active bg-brand-emerald text-white font-bold' : 'text-white/60'}`}
                  onClick={() => setActiveView('journey')}
                >
                  <MapIcon className="w-3 h-3" />
                  {t('salatAnalytics.viewJourney', 'Journey')}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="tabs tabs-boxed tabs-sm bg-brand-deep border border-brand-border">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    className={`tab text-xs ${!selectedMonth && days === p.value ? 'tab-active bg-brand-emerald text-white font-bold' : 'text-white/60'}`}
                    onClick={() => {
                      setDays(p.value);
                      setSelectedMonth(null);
                      setShowMonthPicker(false);
                    }}
                  >
                    {t(`salatAnalytics.period${p.value}`)}
                  </button>
                ))}
              </div>
              {/* Divider + month picker toggle */}
              <div className="w-px h-5 bg-brand-border mx-1" />
              <button
                onClick={() => setShowMonthPicker((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedMonth || showMonthPicker
                    ? 'bg-brand-emerald/20 border-brand-emerald/40 text-brand-emerald'
                    : 'bg-brand-deep border-brand-border text-white/60 hover:text-white'
                }`}
              >
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                {selectedMonth
                  ? formatLocaleDate(new Date(selectedMonth.year, selectedMonth.month - 1, 15), {
                      month: 'short',
                      year: 'numeric',
                    })
                  : t('salatAnalytics.monthPicker', 'Month')}
              </button>
            </div>
          </div>

          {/* Month picker panel */}
          {showMonthPicker &&
            (() => {
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth() + 1;
              return (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-brand-emerald/20 bg-brand-deep/90 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setPickerYear((y) => y - 1)}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <span className="text-white font-bold text-sm">{pickerYear}</span>
                    <button
                      onClick={() => setPickerYear((y) => y + 1)}
                      disabled={pickerYear >= currentYear}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-20"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const isFuture =
                        pickerYear > currentYear ||
                        (pickerYear === currentYear && m > currentMonth);
                      const isSelected =
                        selectedMonth?.year === pickerYear && selectedMonth?.month === m;
                      return (
                        <button
                          key={m}
                          disabled={isFuture}
                          onClick={() => {
                            setSelectedMonth({ year: pickerYear, month: m });
                            setShowMonthPicker(false);
                          }}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-brand-emerald text-white'
                              : isFuture
                                ? 'opacity-20 cursor-not-allowed text-white/30'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {formatLocaleDate(new Date(pickerYear, m - 1, 15), { month: 'short' })}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })()}

          {activeView === 'stats' && (
            <>
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
                  {/* Period note — only shown when a reset shortened the window */}
                  {data.totalDays < data.periodDays && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20">
                      <span className="text-lg shrink-0">🔄</span>
                      <p className="text-sm text-white/50">
                        {t(
                          'salatAnalytics.resetNote',
                          `Showing ${formatLocaleNumber(data.totalDays)} days — your tracking was reset within the ${formatLocaleNumber(data.periodDays)}-day window. Analytics count from the reset date.`
                        )}
                      </p>
                    </div>
                  )}

                  {/* Stat tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: t('salatAnalytics.completion'),
                        value: `${formatLocaleNumber(data.completionRate)}%`,
                        accent: 'text-brand-emerald',
                      },
                      {
                        label: t('salatAnalytics.currentStreak'),
                        value: formatLocaleNumber(data.currentStreak),
                        accent: 'text-brand-gold',
                      },
                      {
                        label: t('salatAnalytics.bestRun'),
                        value: formatLocaleNumber(data.bestStreak),
                        accent: 'text-brand-info',
                      },
                      {
                        label: t('salatAnalytics.naflDays'),
                        value: formatLocaleNumber(data.naflDays ?? 0),
                        accent: 'text-brand-warm',
                      },
                      {
                        label: t('salatAnalytics.kazaDebt'),
                        value: formatLocaleNumber(debt?.totalOwed ?? 0),
                        accent: 'text-brand-pink',
                      },
                      ...(data.fridayCount > 0
                        ? [
                            {
                              label: t('salatAnalytics.jumuahAttendance'),
                              value: `${formatLocaleNumber(Math.round((data.jumuahAttendedCount / data.fridayCount) * 100))}%`,
                              accent: 'text-brand-gold',
                            },
                          ]
                        : []),
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center"
                      >
                        <p className={`text-2xl font-black ${s.accent}`}>{s.value}</p>
                        <p className="text-white/30 text-[10px] font-bold uppercase mt-1">
                          {s.label}
                        </p>
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
                        <h2 className="text-base font-bold text-white">
                          {t('salatAnalytics.overallBreakdown')}
                        </h2>
                        <span className="text-white/25 text-xs">
                          {t('salatAnalytics.totalSummary', {
                            days: formatLocaleNumber(data.totalDays),
                            total: formatLocaleNumber(data.totalPossiblePrayers),
                          })}
                        </span>
                      </div>
                      <div className="w-full h-4 rounded-full overflow-hidden flex bg-white/10">
                        {data.totalPossiblePrayers > 0 && (
                          <>
                            {[
                              {
                                count: data.completedCount,
                                color: 'bg-brand-emerald',
                                tip: t('salatAnalytics.onTime'),
                              },
                              {
                                count: data.kazaCount,
                                color: 'bg-brand-gold',
                                tip: t('salatAnalytics.kaza'),
                              },
                              {
                                count: data.missedCount,
                                color: 'bg-red-600/70',
                                tip: t('salatAnalytics.missed'),
                              },
                            ].map(({ count, color, tip }) => (
                              <motion.div
                                key={tip}
                                title={`${tip}: ${formatLocaleNumber(count)}`}
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
                          {
                            label: t('salatAnalytics.onTime'),
                            count: data.completedCount,
                            color: 'bg-brand-emerald',
                          },
                          {
                            label: t('salatAnalytics.kaza'),
                            count: data.kazaCount,
                            color: 'bg-brand-gold',
                          },
                          {
                            label: t('salatAnalytics.missed'),
                            count: data.missedCount,
                            color: 'bg-red-600/70',
                          },
                          {
                            label: t('salatAnalytics.mosque'),
                            count: data.mosqueCount,
                            color: 'bg-brand-info',
                          },
                          {
                            label: t('salatAnalytics.jamat'),
                            count: data.jamaatCount,
                            color: 'bg-brand-info',
                          },
                        ].map(({ label, count, color }) => (
                          <div key={label} className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                            <span className="text-white/50">{label}</span>
                            <span className="text-white font-bold">
                              {formatLocaleNumber(count)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-0.5 pt-1 border-t border-brand-emerald/10">
                        <p className="text-white/20 text-xs flex items-center gap-1">
                          <InformationCircleIcon className="w-3 h-3 shrink-0" />
                          {t('salatAnalytics.completionFormula', {
                            days: formatLocaleNumber(data.totalDays),
                          })}{' '}
                          <strong className="text-white/30">
                            {formatLocaleNumber(data.completionRate)}%
                          </strong>
                        </p>
                        <p className="text-white/20 text-xs flex items-center gap-1">
                          <InformationCircleIcon className="w-3 h-3 shrink-0" />
                          {t(
                            'salatAnalytics.missedNote',
                            'Missed includes prayers left unmarked on past days — not only those explicitly tapped "missed".'
                          )}
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
                      <ChartBarIcon className="w-4 h-4 text-brand-emerald" />{' '}
                      {t('salatAnalytics.perPrayer')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {PRAYER_META.filter((p) => p.isTrackable).map((prayer, i) => {
                        const stats = data.perPrayer[prayer.id] ?? {
                          completed: 0,
                          kaza: 0,
                          missed: 0,
                          pending: 0,
                          mosque: 0,
                          jamat: 0,
                          tasbeeh: 0,
                          currentStreak: 0,
                          bestStreak: 0,
                        };
                        const total = data.totalDays;
                        const done = stats.completed + stats.kaza;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        const gradient =
                          PRAYER_GRADIENTS[prayer.id] ?? 'from-white to-brand-border';
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
                                <h3 className="font-black text-white text-base">
                                  {t(`salatAnalytics.prayerName.${prayer.id}`)}
                                </h3>
                              </div>
                              <div className="text-3xl font-black text-white mb-0.5">
                                {formatLocaleNumber(pct)}%
                              </div>
                              <p className="text-white/40 text-xs mb-1.5">
                                {t('salatAnalytics.prayedFormula', {
                                  done: formatLocaleNumber(done),
                                  total: formatLocaleNumber(total),
                                })}
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
                                <span>
                                  ✅{' '}
                                  {t('salatAnalytics.onTimeStat', {
                                    count: formatLocaleNumber(stats.completed),
                                  })}
                                </span>
                                <span>
                                  ⏰{' '}
                                  {t('salatAnalytics.kazaStat', {
                                    count: formatLocaleNumber(stats.kaza),
                                  })}
                                </span>
                                <span>
                                  ❌{' '}
                                  {t('salatAnalytics.missedStat', {
                                    count: formatLocaleNumber(stats.missed),
                                  })}
                                </span>
                                <span>
                                  🕌{' '}
                                  {t('salatAnalytics.mosqueStat', {
                                    count: formatLocaleNumber(stats.mosque),
                                  })}
                                </span>
                                {stats.tasbeeh > 0 && (
                                  <span className="col-span-2">
                                    📿{' '}
                                    {t('salatAnalytics.tasbeehStat', {
                                      count: formatLocaleNumber(stats.tasbeeh),
                                    })}
                                  </span>
                                )}
                              </div>
                              {(stats.currentStreak > 0 || stats.bestStreak > 0) && (
                                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/15 text-xs text-white/80">
                                  <span>
                                    🔥{' '}
                                    {t('salatAnalytics.prayerStreakCurrent', {
                                      count: formatLocaleNumber(stats.currentStreak),
                                    })}
                                  </span>
                                  <span>
                                    🏆{' '}
                                    {t('salatAnalytics.prayerStreakBest', {
                                      count: formatLocaleNumber(stats.bestStreak),
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kaza debt chart — weekly accumulation vs payback, stacked bars */}
                  {debtHistory && debtHistory.some((w) => w.accumulated > 0 || w.paidBack > 0) && (
                    <div className="space-y-3">
                      <h2 className="text-white font-black text-sm flex items-center gap-2">
                        <ChartBarIcon className="w-4 h-4 text-brand-emerald" />{' '}
                        {t('salatAnalytics.kazaDebtChart')}
                      </h2>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card bg-brand-deep/80 border border-brand-border rounded-2xl overflow-x-auto"
                      >
                        <div className="card-body p-5">
                          <div className="flex items-center gap-3 text-[11px] text-white/50 mb-3">
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-sm bg-red-500/70 inline-block" />{' '}
                              {t('salatAnalytics.kazaDebtAccumulated')}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-sm bg-brand-emerald inline-block" />{' '}
                              {t('salatAnalytics.kazaDebtPaidBack')}
                            </span>
                          </div>
                          {(() => {
                            const maxTotal = Math.max(
                              1,
                              ...debtHistory.map((w) => w.accumulated + w.paidBack)
                            );
                            return (
                              <div className="flex items-end gap-2 h-36 min-w-max">
                                {debtHistory.map((w, i) => {
                                  const total = w.accumulated + w.paidBack;
                                  const barHeightPct = (total / maxTotal) * 100;
                                  const accShare = total > 0 ? (w.accumulated / total) * 100 : 0;
                                  const paidShare = total > 0 ? (w.paidBack / total) * 100 : 0;
                                  return (
                                    <div
                                      key={w.weekStart}
                                      className="flex flex-col items-center gap-1.5 w-9 shrink-0"
                                    >
                                      <div className="w-full h-24 bg-white/5 rounded-md flex flex-col justify-end overflow-hidden">
                                        <motion.div
                                          initial={{ height: 0 }}
                                          animate={{ height: `${barHeightPct}%` }}
                                          transition={{ duration: 0.5, delay: i * 0.03 }}
                                          className="w-full flex flex-col justify-end rounded-t-sm overflow-hidden"
                                        >
                                          <div
                                            style={{ height: `${accShare}%` }}
                                            className="w-full bg-red-500/70"
                                            title={`+${w.accumulated}`}
                                          />
                                          <div
                                            style={{ height: `${paidShare}%` }}
                                            className="w-full bg-brand-emerald"
                                            title={`-${w.paidBack}`}
                                          />
                                        </motion.div>
                                      </div>
                                      <span className="text-white/25 text-[9px]">
                                        {formatLocaleDate(new Date(w.weekStart + 'T12:00:00'), {
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                          <p className="text-white/25 text-[10px] mt-3">
                            {t('salatAnalytics.kazaDebtChartHint')}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Mosque frequency trend — weekly attendance rate, last 12 weeks max */}
                  {data.weeklyMosqueTrend.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-white font-black text-sm flex items-center gap-2">
                        <ChartBarIcon className="w-4 h-4 text-brand-emerald" />{' '}
                        {t('salatAnalytics.mosqueTrend')}
                      </h2>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card bg-brand-deep/80 border border-brand-border rounded-2xl overflow-x-auto"
                      >
                        <div className="card-body p-5">
                          <div className="flex items-end gap-2 h-36 min-w-max">
                            {data.weeklyMosqueTrend.map((w, i) => (
                              <div
                                key={w.weekStart}
                                className="flex flex-col items-center gap-1.5 w-9 shrink-0"
                              >
                                <span className="text-white/40 text-[10px] font-bold">
                                  {formatLocaleNumber(w.rate)}%
                                </span>
                                <div className="w-full h-24 bg-white/5 rounded-md flex items-end overflow-hidden">
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${w.rate}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.03 }}
                                    className="w-full bg-gradient-to-t from-brand-emerald to-brand-info rounded-t-sm"
                                  />
                                </div>
                                <span className="text-white/25 text-[9px]">
                                  {formatLocaleDate(new Date(w.weekStart + 'T12:00:00'), {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-white/25 text-[10px] mt-3">
                            {t('salatAnalytics.mosqueTrendHint')}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Prayer Calendar — horizontal (weeks flow left→right, days top→bottom) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-white font-black text-sm">
                        {t('salatAnalytics.prayerCalendar')}
                      </h2>
                      <span className="text-white/25 text-xs">
                        {t('salatAnalytics.lastDays', {
                          count: formatLocaleNumber(data.calendarData.length),
                        })}
                      </span>
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
                                {ml ? (
                                  <span className="text-white/30 text-[10px] leading-none">
                                    {ml.label}
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex gap-1">
                          {/* Day-of-week labels on the left (Islamic week: Fri→Thu) */}
                          <div className="flex flex-col gap-1 w-9 shrink-0">
                            {DAY_LABELS.map((d, i) => (
                              <div
                                key={i}
                                className={`h-7 flex items-center text-[11px] ${i === 0 ? 'text-brand-emerald/60 font-semibold' : 'text-white/25'}`}
                              >
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
                                  const isLogged = data.calendarData.some(
                                    (c) => c.date === cell.date
                                  );
                                  const isPerfect = cell.completed === 5;
                                  const isToday = cell.date === todayStr;
                                  const isFuture = cell.date > todayStr;
                                  return (
                                    <motion.div
                                      key={di}
                                      initial={{ opacity: 0, scale: 0.5 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{
                                        delay: (wi + di * calendarWeeks.length) * 0.004,
                                        duration: 0.25,
                                      }}
                                      className="tooltip"
                                      data-tip={t('salatAnalytics.calendarTip', {
                                        date: cell.date,
                                        completed: formatLocaleNumber(cell.completed),
                                      })}
                                    >
                                      <button
                                        onClick={() =>
                                          !isFuture && navigate(`/salat?date=${cell.date}`)
                                        }
                                        disabled={isFuture}
                                        aria-label={`${cell.date}: ${cell.completed}/5`}
                                        className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold transition-transform ${
                                          isFuture
                                            ? 'cursor-default'
                                            : 'hover:scale-110 cursor-pointer'
                                        } ${
                                          isToday
                                            ? 'ring-2 ring-brand-emerald ring-offset-1 ring-offset-brand-surface'
                                            : ''
                                        }`}
                                        style={{
                                          ...calendarCellStyle(cell.completed, isLogged),
                                          ...(isPerfect
                                            ? { boxShadow: '0 0 8px rgba(122,158,110,0.35)' }
                                            : {}),
                                        }}
                                      >
                                        {isLogged && (
                                          <span
                                            className={
                                              isPerfect
                                                ? 'text-white'
                                                : cell.completed >= 3
                                                  ? 'text-white/80'
                                                  : cell.completed > 0
                                                    ? 'text-white/60'
                                                    : 'text-white/40'
                                            }
                                          >
                                            {formatLocaleNumber(cell.completed)}
                                          </span>
                                        )}
                                      </button>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-1.5 mt-4 pl-10 flex-wrap">
                          <span className="text-white/25 text-xs mr-1">
                            {t('salatAnalytics.less')}
                          </span>
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <div
                              key={n}
                              className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white/50"
                              style={calendarCellStyle(n, true)}
                            >
                              {formatLocaleNumber(n)}
                            </div>
                          ))}
                          <span className="text-white/25 text-xs ml-1">
                            {t('salatAnalytics.more')}
                          </span>
                          <span className="text-white/20 text-xs ml-2">
                            {t('salatAnalytics.prayersPerDay')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Journey view ── */}
          {activeView === 'journey' && (
            <div className="space-y-3">
              {journeyLoading && (
                <div className="flex justify-center py-20">
                  <span className="loading loading-spinner loading-lg text-brand-emerald" />
                </div>
              )}
              {!journeyLoading && journeyPhases && journeyPhases.length === 0 && (
                <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-8 text-center">
                  <p className="text-white/40 text-sm">
                    {t(
                      'salatAnalytics.journeyEmpty',
                      'Start tracking your prayers to see your journey here.'
                    )}
                  </p>
                </div>
              )}
              {!journeyLoading &&
                journeyPhases &&
                journeyPhases.map((phase, i) => {
                  const isCurrentPhase = phase.to === null;
                  const totalPossible = phase.days * 5;
                  return (
                    <motion.div
                      key={phase.index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      {/* Reset divider above every non-current phase */}
                      {!isCurrentPhase && (
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1 h-px bg-brand-emerald/10" />
                          <span className="text-[11px] text-brand-emerald/50 font-semibold px-2 py-0.5 rounded-full bg-brand-emerald/10 border border-brand-emerald/20">
                            🔄 {t('salatAnalytics.journeyReset', 'Reset')}
                            {phase.resetNote ? ` — ${phase.resetNote}` : ''}
                          </span>
                          <div className="flex-1 h-px bg-brand-emerald/10" />
                        </div>
                      )}

                      <div
                        className={`rounded-2xl border p-5 space-y-4 ${
                          isCurrentPhase
                            ? 'bg-brand-emerald/10 border-brand-emerald/30'
                            : 'bg-brand-deep/80 border-brand-border'
                        }`}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${isCurrentPhase ? 'text-brand-emerald' : 'text-white/40'}`}
                            >
                              {isCurrentPhase
                                ? t('salatAnalytics.journeyCurrent', 'Current journey')
                                : t('salatAnalytics.journeyPhase', 'Phase {{n}}', {
                                    n: formatLocaleNumber(journeyPhases.length - i),
                                  })}
                            </p>
                            <p className="text-white/50 text-xs">
                              {formatLocaleDate(new Date(phase.from + 'T12:00:00'), {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                              {' → '}
                              {phase.to
                                ? formatLocaleDate(new Date(phase.to + 'T12:00:00'), {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : t('salatAnalytics.journeyNow', 'now')}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className={`text-2xl font-black ${isCurrentPhase ? 'text-brand-emerald' : 'text-white/70'}`}
                            >
                              {formatLocaleNumber(phase.completionRate)}%
                            </p>
                            <p className="text-white/30 text-[10px]">
                              {t('salatAnalytics.journeyDays', '{{n}} days', {
                                n: formatLocaleNumber(phase.days),
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/10">
                          {totalPossible > 0 && (
                            <>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${((phase.done - phase.kaza) / totalPossible) * 100}%`,
                                }}
                                transition={{ duration: 0.7, delay: i * 0.06 }}
                                className="h-full bg-brand-emerald"
                              />
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(phase.kaza / totalPossible) * 100}%` }}
                                transition={{ duration: 0.7, delay: i * 0.06 + 0.05 }}
                                className="h-full bg-brand-gold"
                              />
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(phase.missed / totalPossible) * 100}%` }}
                                transition={{ duration: 0.7, delay: i * 0.06 + 0.1 }}
                                className="h-full bg-red-600/60"
                              />
                            </>
                          )}
                        </div>

                        {/* Stat chips */}
                        <div className="flex flex-wrap gap-3 text-xs">
                          {[
                            {
                              label: t('salatAnalytics.onTime'),
                              count: phase.done - phase.kaza,
                              color: 'text-brand-emerald',
                            },
                            {
                              label: t('salatAnalytics.kaza'),
                              count: phase.kaza,
                              color: 'text-brand-gold',
                            },
                            {
                              label: t('salatAnalytics.missed'),
                              count: phase.missed,
                              color: 'text-red-400',
                            },
                          ].map(({ label, count, color }) => (
                            <span key={label} className={`font-bold ${color}`}>
                              {formatLocaleNumber(count)}{' '}
                              <span className="font-normal text-white/30">{label}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              <p className="text-white/20 text-[11px] text-center pt-2 flex items-center justify-center gap-1">
                <InformationCircleIcon className="w-3 h-3 shrink-0" />
                {t(
                  'salatAnalytics.journeyNote',
                  'Missed includes prayers left unmarked on past days.'
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}
