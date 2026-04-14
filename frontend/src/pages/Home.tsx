import React, { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useZikrStore } from '../store/useZikrStore.js';
import { useAnalytics } from '../hooks/useAnalytics.js';
import AnimatedBackground from '../components/AnimatedBackground.js';

interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  stats: { label: string; value: string | number };
  action: string;
  link: string;
  accentColor: string;
  iconBg: string;
  tag: string;
  streakCount?: number | null;
  goalCompleted?: boolean;
}

export default function Home() {
  const { counts = {}, hydrate } = useZikrStore();
  const location = useLocation();

  useEffect(() => {
    const doHydrate = () => hydrate?.();
    doHydrate();
    const onFocus = () => doHydrate();
    const onVisibility = () => { if (!document.hidden) doHydrate(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const { data: analyticsData, isLoading: loadingAnalytics } = useAnalytics(1);

  const totalToday = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);
  const analyticsGoal = analyticsData?.goal?.dailyTarget ?? null;
  const streakCount = analyticsData?.streak?.currentStreak ?? null;
  const goalCompleted = totalToday !== null && analyticsGoal !== null ? totalToday >= analyticsGoal : false;

  const activities: ActivityItem[] = [
    {
      id: 'zikr',
      icon: '📿',
      title: 'Zikr Counter',
      description: 'Continue your remembrance of Allah',
      stats: { label: 'Today', value: totalToday },
      action: 'Start Counting',
      link: '/zikr',
      accentColor: 'var(--brand-emerald, #10b981)',
      iconBg: 'bg-gradient-to-br from-brand-emerald/20 to-emerald-400/30',
      tag: 'Developing',
      streakCount,
      goalCompleted,
    },
    {
      id: 'salat',
      icon: '🕌',
      title: 'Salat Tracker',
      description: 'Track your daily prayers',
      stats: { label: 'Today', value: '0/5' },
      action: 'Track Prayer',
      link: '/salat',
      accentColor: 'var(--brand-emerald, #10b981)',
      iconBg: 'bg-gradient-to-br from-indigo-500/20 to-purple-500/30',
      tag: 'Coming Soon…',
    },
    {
      id: 'fasting',
      icon: '🌙',
      title: 'Fasting Tracker',
      description: 'Monitor your fasting journey',
      stats: { label: 'Streak', value: '0 days' },
      action: 'Log Fast',
      link: '/fasting',
      accentColor: 'var(--brand-magenta, #c026d3)',
      iconBg: 'bg-gradient-to-br from-brand-magenta/20 to-pink-500/30',
      tag: 'Coming Soon…',
    },
    {
      id: 'prayer-times',
      icon: '⏰',
      title: 'Prayer Times',
      description: 'Never miss a prayer',
      stats: { label: 'Next Prayer', value: 'Fajr' },
      action: 'View Times',
      link: '/prayer-times',
      accentColor: 'var(--brand-gold, #f59e0b)',
      iconBg: 'bg-gradient-to-br from-brand-gold/20 to-amber-500/30',
      tag: 'Coming Soon…',
    },
  ];

  return (
    <AnimatedBackground variant="premium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {activities.map((a, i) => {
            const isZikr = a.id === 'zikr';
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link to={a.link} className="block h-full group">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative h-full rounded-3xl overflow-hidden backdrop-blur-2xl border border-white/10 bg-white/5"
                  >
                    <span
                      className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md border border-white/10"
                      style={{
                        letterSpacing: '0.04em',
                        background:
                          a.tag === 'Developing'
                            ? 'linear-gradient(90deg, var(--brand-emerald) 0%, var(--brand-magenta) 100%)'
                            : 'linear-gradient(90deg, var(--brand-gold) 0%, var(--brand-magenta) 100%)',
                      }}
                    >
                      {a.tag}
                    </span>

                    {isZikr && (
                      <div className="absolute top-4 right-4 z-20 flex flex-row items-center gap-2">
                        <div className="tooltip tooltip-left" data-tip={`Streak: ${a.streakCount ?? '-'} day${a.streakCount === 1 ? '' : 's'}`}>
                          <div className="px-2 py-1 rounded-full flex items-center gap-1 font-bold shadow-lg border border-white/10 backdrop-blur-md bg-gradient-to-br from-brand-emerald/60 via-pink-400/30 to-brand-gold/40">
                            <span className="text-base" role="img" aria-label="streak">🔥</span>
                            <span className="text-xs text-white/90 font-bold">
                              {a.streakCount !== null ? a.streakCount : <span className="loading loading-spinner loading-xs" />}
                            </span>
                          </div>
                        </div>
                        <div
                          className="tooltip tooltip-left"
                          data-tip={a.goalCompleted ? '🏆 Daily goal achieved!' : `🎯 Goal: ${analyticsGoal ?? '…'} zikr/day`}
                        >
                          <div className={`px-2 py-1 rounded-full flex items-center font-bold shadow-lg border border-white/10 backdrop-blur-md bg-gradient-to-br from-brand-gold/60 via-pink-400/30 to-brand-emerald/40 ${a.goalCompleted ? '' : 'opacity-70'}`}>
                            <span className="text-base" role="img" aria-label="goal">
                              {a.goalCompleted ? '✅' : '🎯'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="relative z-10 p-6 sm:p-8">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 ${a.iconBg} rounded-2xl grid place-items-center border border-white/10 mb-5`}>
                        <span className="text-4xl sm:text-5xl">{a.icon}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{a.title}</h2>
                      <p className="text-white/70 text-sm sm:text-base mb-6">{a.description}</p>
                      <div
                        className="rounded-2xl p-4 text-center text-white"
                        style={{ background: `linear-gradient(135deg, ${a.accentColor}90, ${a.accentColor}70)` }}
                      >
                        <div className="text-3xl sm:text-4xl font-black">{a.stats.value}</div>
                        <div className="text-xs sm:text-sm opacity-90 font-semibold mt-1 uppercase">{a.stats.label}</div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-5 w-full py-3 rounded-xl text-white font-bold relative overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${a.accentColor}, ${a.accentColor}cc)` }}
                      >
                        <span className="relative z-10">{a.action}</span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.6 }}
                        />
                      </motion.button>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center text-xs text-white/50">May your remembrance be constant.</div>
      </div>
    </AnimatedBackground>
  );
}
