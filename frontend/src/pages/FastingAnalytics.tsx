import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import TabNav from '../components/TabNav.js';
import { TrashIcon } from '@heroicons/react/24/outline';
import {
  useFastingSummary,
  useFastingHistory,
  useUpsertFastingLog,
  useClearFastingLog,
  localTodayStr,
  FastingLog,
} from '../hooks/useFasting.js';
import { FastingCategory, VOLUNTARY_BY_ID } from '../utils/fastingRules.js';

// Chart palette — validated (dataviz six checks, dark surface): identity per
// category, fixed order, never cycled. Chips elsewhere use the app's lighter
// hues of the same families.
const CATEGORY_CHART: Record<FastingCategory, { label: string; emoji: string; color: string }> = {
  voluntary: { label: 'Voluntary', emoji: '💚', color: '#059669' },
  qada:      { label: 'Qaḍā',      emoji: '🔄', color: '#d97706' },
  kaffarah:  { label: 'Kaffārah',  emoji: '⚖️', color: '#9333ea' },
  nadhr:     { label: 'Vow',       emoji: '🤝', color: '#0891b2' },
  ramadan:   { label: 'Ramadan',   emoji: '🌙', color: '#b45309' },
};
const CATEGORY_ORDER: FastingCategory[] = ['voluntary', 'qada', 'kaffarah', 'nadhr'];

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  completed: { label: '✓ Fasted',   cls: 'bg-brand-emerald/15 text-brand-emerald border-brand-emerald/40' },
  intended:  { label: '🌅 Intended', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40' },
  broken:    { label: '💔 Broken',   cls: 'bg-red-500/15 text-red-300 border-red-400/40' },
};

function monthLabel(ym: string): string {
  return new Date(ym + '-15T12:00:00').toLocaleDateString('en-US', { month: 'short' });
}

export default function FastingAnalytics() {
  const { data: summary } = useFastingSummary();
  const { data: logs, isLoading } = useFastingHistory(365, true);
  const upsert = useUpsertFastingLog();
  const clearLog = useClearFastingLog();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const today = localTodayStr();

  // ── Derived analytics (12-month window) ─────────────────────────────────────
  const derived = useMemo(() => {
    const completed = (logs ?? []).filter((l) => l.status === 'completed');
    const broken = (logs ?? []).filter((l) => l.status === 'broken');

    const byCategory: Record<string, number> = {};
    for (const l of completed) byCategory[l.category] = (byCategory[l.category] ?? 0) + 1;

    // Last 6 calendar months
    const months: Array<{ ym: string; count: number }> = [];
    const now = new Date(today + 'T12:00:00');
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ ym, count: 0 });
    }
    const monthIdx = new Map(months.map((m, i) => [m.ym, i]));
    for (const l of completed) {
      const idx = monthIdx.get(l.date.substring(0, 7));
      if (idx !== undefined) months[idx]!.count += 1;
    }

    // Group history newest-first by month for the list
    const groups: Array<{ ym: string; items: FastingLog[] }> = [];
    const sorted = [...(logs ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));
    for (const l of sorted) {
      const ym = l.date.substring(0, 7);
      const last = groups[groups.length - 1];
      if (last && last.ym === ym) last.items.push(l);
      else groups.push({ ym, items: [l] });
    }

    return { completedCount: completed.length, brokenCount: broken.length, byCategory, months, groups };
  }, [logs, today]);

  const maxMonth = Math.max(1, ...derived.months.map((m) => m.count));
  const maxCat = Math.max(1, ...CATEGORY_ORDER.map((c) => derived.byCategory[c] ?? 0));

  const setStatus = (l: FastingLog, status: 'completed' | 'broken') => {
    if (l.status === status) return;
    upsert.mutate({
      date: l.date,
      category: l.category,
      voluntaryKind: l.voluntaryKind,
      vowId: l.vowId,
      status,
      hijri: l.hijri,
      note: l.note,
    });
  };

  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Fasting Analytics</h1>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto space-y-4">

          <TabNav
            items={[
              { label: '🌙 Tracker', to: '/fasting' },
              { label: '📊 Analytics', to: '/fasting/analytics', active: true },
            ]}
          />

          {isLoading ? (
            <div className="min-h-[40vh] grid place-items-center">
              <span className="loading loading-spinner loading-lg text-brand-emerald" />
            </div>
          ) : (
            <>
              {/* ── Stat tiles ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'All time', value: summary?.stats.total ?? 0, sub: 'fasts completed' },
                  { label: 'This month', value: summary?.stats.thisMonth ?? 0, sub: 'fasts' },
                  { label: 'Last 30 days', value: summary?.stats.last30 ?? 0, sub: 'fasts' },
                  { label: 'Broken', value: derived.brokenCount, sub: 'last 12 months' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3"
                  >
                    <p className="text-white/35 text-[10px] uppercase tracking-widest font-bold">{s.label}</p>
                    <p className="text-white font-black text-2xl tabular-nums mt-0.5">{s.value}</p>
                    <p className="text-white/25 text-[10px]">{s.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* ── Category breakdown ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3"
              >
                <p className="text-white/70 font-bold text-sm">Completed fasts by type <span className="text-white/25 font-normal text-[11px]">— last 12 months</span></p>
                <div className="space-y-2.5">
                  {CATEGORY_ORDER.map((c) => {
                    const meta = CATEGORY_CHART[c];
                    const count = derived.byCategory[c] ?? 0;
                    const pct = Math.round((count / maxCat) * 100);
                    return (
                      <div key={c} className="group" title={`${meta.label}: ${count} completed`}>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-white/60 text-xs font-semibold flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: meta.color }} />
                            {meta.emoji} {meta.label}
                          </span>
                          <span className="text-white/80 text-xs font-bold tabular-nums">{count}</span>
                        </div>
                        <div className="w-full bg-white/8 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${count > 0 ? Math.max(pct, 4) : 0}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full group-hover:opacity-80 transition-opacity"
                            style={{ background: meta.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── Monthly trend ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <p className="text-white/70 font-bold text-sm mb-3">Completed fasts per month</p>
                <div className="flex items-end justify-between gap-2 h-28">
                  {derived.months.map((m) => {
                    const isMax = m.count === maxMonth && m.count > 0;
                    const isCurrent = m.ym === today.substring(0, 7);
                    const h = m.count > 0 ? Math.max(10, (m.count / maxMonth) * 100) : 4;
                    return (
                      <div
                        key={m.ym}
                        className="flex-1 flex flex-col items-center gap-1 tooltip"
                        data-tip={`${monthLabel(m.ym)}: ${m.count} fast${m.count === 1 ? '' : 's'}`}
                      >
                        {/* Selective direct label: only the peak month */}
                        <span className={`text-[10px] font-bold h-3 leading-none ${isMax ? 'text-white/70' : 'text-transparent'}`}>
                          {m.count}
                        </span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`w-full rounded-t-[4px] ${isCurrent ? 'ring-1 ring-white/30' : ''}`}
                          style={{ background: m.count > 0 ? '#059669' : 'rgba(255,255,255,0.08)' }}
                        />
                        <span className={`text-[9px] ${isCurrent ? 'text-white/60 font-bold' : 'text-white/25'}`}>
                          {monthLabel(m.ym)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── History (edit / delete) ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden"
              >
                <div className="px-4 pt-4 pb-2">
                  <p className="text-white/70 font-bold text-sm">Fasting history</p>
                  <p className="text-white/25 text-[10px]">Every logged day — fix a status or remove an entry</p>
                </div>
                {derived.groups.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-10">
                    No fasts logged yet — start from the Tracker tab 🌙
                  </p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {derived.groups.map((g) => (
                      <div key={g.ym}>
                        <p className="px-4 py-1.5 bg-white/[0.03] text-white/30 text-[10px] font-bold uppercase tracking-widest">
                          {new Date(g.ym + '-15T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          <span className="ml-2 normal-case font-semibold">
                            {g.items.filter((l) => l.status === 'completed').length} fasted
                          </span>
                        </p>
                        {g.items.map((l) => {
                          const cat = CATEGORY_CHART[l.category as FastingCategory];
                          const chip = STATUS_CHIP[l.status] ?? STATUS_CHIP['completed']!;
                          return (
                            <div key={l.date} className="px-4 py-2.5 flex items-center gap-3">
                              {/* Date */}
                              <div className="w-11 shrink-0 text-center">
                                <p className="text-white font-black text-base leading-none tabular-nums">{parseInt(l.date.slice(8), 10)}</p>
                                <p className="text-white/30 text-[9px] uppercase">
                                  {new Date(l.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                                </p>
                              </div>
                              {/* Type */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: cat?.color ?? '#fff' }}>
                                  {cat?.emoji} {l.category === 'voluntary' && l.voluntaryKind
                                    ? VOLUNTARY_BY_ID[l.voluntaryKind]?.label ?? cat.label
                                    : cat?.label}
                                </p>
                                {l.hijri && <p className="text-white/25 text-[10px] truncate">{l.hijri}</p>}
                              </div>
                              {/* Status chip / editor */}
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${chip.cls}`}>
                                {chip.label}
                              </span>
                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                {l.status !== 'completed' && l.date <= today && (
                                  <button
                                    onClick={() => setStatus(l, 'completed')}
                                    title="Mark as fasted"
                                    aria-label={`Mark ${l.date} as fasted`}
                                    className="p-1.5 rounded-lg text-white/30 hover:text-brand-emerald hover:bg-brand-emerald/10 text-xs"
                                  >✓</button>
                                )}
                                {l.status !== 'broken' && l.date <= today && (
                                  <button
                                    onClick={() => setStatus(l, 'broken')}
                                    title="Mark as broken"
                                    aria-label={`Mark ${l.date} as broken`}
                                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 text-xs"
                                  >💔</button>
                                )}
                                {confirmDelete === l.date ? (
                                  <button
                                    onClick={() => { clearLog.mutate(l.date); setConfirmDelete(null); }}
                                    className="px-2 py-1 rounded-lg bg-red-500 text-white text-[10px] font-bold"
                                  >Sure?</button>
                                ) : (
                                  <button
                                    onClick={() => { setConfirmDelete(l.date); setTimeout(() => setConfirmDelete((d) => (d === l.date ? null : d)), 2500); }}
                                    title="Delete entry"
                                    aria-label={`Delete ${l.date} entry`}
                                    className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10"
                                  ><TrashIcon className="w-3.5 h-3.5" /></button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}
