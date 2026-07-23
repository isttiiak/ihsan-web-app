import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import TabNav from '../components/TabNav.js';
import ConfirmDialog from '../components/ConfirmDialog.js';
import {
  useCycleSummary, useAddPastCycle, useDeleteCycleLog, useIsFemale,
} from '../hooks/useCycle.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { getTrackingDay } from '../utils/trackingDay.js';

/**
 * Rayhanah Analytics — her rhythm, in numbers she can trust.
 * All statistics are computed client-side from the episode history:
 *   mean & standard deviation of start-to-start gaps → regularity score and
 *   prediction WINDOWS (mean ± SD), not false-precision single dates.
 */

function shiftStr(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86_400_000);
}
function fmt(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtFull(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SYMPTOM_LABEL: Record<string, string> = {
  cramps: '🌀 Cramps', headache: '🤕 Headache', fatigue: '🪫 Fatigue', nausea: '🌊 Nausea',
  backache: '🦴 Backache', bloating: '🎈 Bloating', tenderness: '🌡️ Tenderness', insomnia: '🌙 Insomnia',
};

export default function CycleAnalytics() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isFemale = useIsFemale();
  const today = getTrackingDay();

  const { data: summary, isLoading } = useCycleSummary();
  const addPast = useAddPastCycle();
  const deleteLog = useDeleteCycleLog();

  const [pastOpen, setPastOpen] = useState(false);
  const [pastStart, setPastStart] = useState('');
  const [pastEnd, setPastEnd] = useState('');
  const [pastType, setPastType] = useState<'hayd' | 'nifas'>('hayd');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null);

  const stats = useMemo(() => {
    const hayd = (summary?.logs ?? [])
      .filter((l) => l.type === 'hayd')
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    const gaps: Array<{ from: string; days: number }> = [];
    for (let i = 1; i < hayd.length; i++) {
      const g = daysBetween(hayd[i - 1]!.startDate, hayd[i]!.startDate);
      if (g >= 15 && g <= 60) gaps.push({ from: hayd[i - 1]!.startDate, days: g });
    }
    const lengths = hayd
      .filter((l) => l.endDate)
      .map((l) => ({ from: l.startDate, days: daysBetween(l.startDate, l.endDate!) + 1 }))
      .filter((x) => x.days >= 1 && x.days <= 15);

    const gapVals = gaps.map((g) => g.days);
    const mean = gapVals.length ? gapVals.reduce((a, b) => a + b, 0) / gapVals.length : 28;
    const sd = gapVals.length > 1
      ? Math.sqrt(gapVals.reduce((a, b) => a + (b - mean) ** 2, 0) / (gapVals.length - 1))
      : 0;
    const lenVals = lengths.map((l) => l.days);
    const meanLen = lenVals.length ? lenVals.reduce((a, b) => a + b, 0) / lenVals.length : 7;

    // Regularity: SD of cycle gaps (medically, ≤~4 days variation reads as regular)
    const regularity =
      gapVals.length < 2 ? { label: 'Learning…', tone: 'text-white/40' }
      : sd <= 2 ? { label: 'Very regular', tone: 'text-emerald-300' }
      : sd <= 4 ? { label: 'Regular', tone: 'text-emerald-300/80' }
      : sd <= 7 ? { label: 'Somewhat variable', tone: 'text-amber-300/80' }
      : { label: 'Irregular', tone: 'text-rose-300/80' };

    // Next 3 predicted windows: lastStart + n·mean, each ± max(1, round(SD))
    const lastStart = hayd.length ? hayd[hayd.length - 1]!.startDate : null;
    const spread = Math.max(1, Math.round(sd));
    const windows = lastStart
      ? [1, 2, 3].map((n) => {
          const center = shiftStr(lastStart, Math.round(n * mean));
          return { center, from: shiftStr(center, -spread), to: shiftStr(center, spread) };
        }).filter((w) => w.center >= today || daysBetween(w.center, today) < Math.round(mean))
      : [];

    // Wellness insights
    const days = summary?.days ?? [];
    const symCount = new Map<string, number>();
    let flowLight = 0, flowMed = 0, flowHeavy = 0, moodCount = new Map<string, number>();
    for (const d of days) {
      for (const sy of d.symptoms) symCount.set(sy, (symCount.get(sy) ?? 0) + 1);
      if (d.flow === 'light') flowLight++;
      if (d.flow === 'medium') flowMed++;
      if (d.flow === 'heavy') flowHeavy++;
      for (const mo of d.moods ?? []) moodCount.set(mo, (moodCount.get(mo) ?? 0) + 1);
    }
    const topSymptoms = [...symCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const flowTotal = flowLight + flowMed + flowHeavy;

    return { gaps, lengths, mean, sd, meanLen, regularity, windows, topSymptoms, flowLight, flowMed, flowHeavy, flowTotal, haydCount: hayd.length };
  }, [summary, today]);

  if (!user || !isFemale) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-4 text-center">
        <div>
          <div className="text-5xl mb-4">🌸</div>
          <p className="text-white/60 text-sm max-w-sm">
            Rayhanah Analytics is a private space for our sisters — set your gender to female in{' '}
            <button className="text-brand-emerald underline" onClick={() => navigate('/profile')}>your profile</button>.
          </p>
        </div>
      </div>
    );
  }

  const maxGap = Math.max(1, ...stats.gaps.map((g) => g.days));
  const maxLen = Math.max(1, ...stats.lengths.map((l) => l.days));

  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Rayhanah Analytics</h1>
      <div className="px-4 pt-3">
        <div className="max-w-2xl mx-auto">
          <TabNav
            items={[
              { label: '🌸 Cycle', to: '/cycle' },
              { label: '📊 Analytics', to: '/cycle/analytics', active: true },
            ]}
          />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-16 space-y-5">

        {isLoading ? (
          <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-10 grid place-items-center">
            <span className="loading loading-spinner loading-lg text-pink-300" />
          </div>
        ) : (
          <>
            {/* Stat tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
                <p className="text-2xl font-black text-pink-200">{stats.haydCount}</p>
                <p className="text-white/30 text-[10px] font-bold uppercase mt-1">cycles tracked</p>
              </div>
              <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
                <p className="text-2xl font-black text-pink-200">{stats.gaps.length ? Math.round(stats.mean) : '—'}</p>
                <p className="text-white/30 text-[10px] font-bold uppercase mt-1">avg cycle days</p>
              </div>
              <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
                <p className="text-2xl font-black text-pink-200">{stats.lengths.length ? Math.round(stats.meanLen) : '—'}</p>
                <p className="text-white/30 text-[10px] font-bold uppercase mt-1">avg period days</p>
              </div>
              <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
                <p className={`text-sm font-black mt-1.5 ${stats.regularity.tone}`}>{stats.regularity.label}</p>
                <p className="text-white/30 text-[10px] font-bold uppercase mt-1.5">regularity {stats.gaps.length > 1 ? `(±${Math.round(stats.sd)}d)` : ''}</p>
              </div>
            </div>

            {/* Predicted windows */}
            <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
              <h2 className="text-white font-black">🔮 Expected windows</h2>
              <p className="text-white/30 text-xs mt-0.5">
                Mean cycle ± variability — a window, not a promise. Your body sets the truth.
              </p>
              {stats.windows.length === 0 ? (
                <p className="text-white/40 text-sm mt-3">Log at least one cycle and Rayhanah starts forecasting.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {stats.windows.map((w, i) => (
                    <motion.div
                      key={w.center}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-3 rounded-xl bg-pink-500/10 border border-pink-400/15 px-4 py-2.5"
                    >
                      <span className="text-lg">{['🌸', '🌷', '🌺'][i]}</span>
                      <div className="flex-1">
                        <p className="text-pink-100/90 text-sm font-bold">{fmt(w.from)} – {fmt(w.to)}</p>
                        <p className="text-white/30 text-[10px]">most likely around {fmtFull(w.center)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Cycle & period length history */}
            {stats.gaps.length > 0 && (
              <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
                <h2 className="text-white font-black mb-3">📈 Cycle length history</h2>
                <div className="space-y-1.5">
                  {stats.gaps.slice(-8).map((g) => (
                    <div key={g.from} className="flex items-center gap-2 text-xs">
                      <span className="text-white/30 w-14">{fmt(g.from)}</span>
                      <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-pink-500/60 to-rose-400/60" style={{ width: `${(g.days / maxGap) * 100}%` }} />
                      </div>
                      <span className="text-pink-200/80 font-bold w-8 text-right">{g.days}d</span>
                    </div>
                  ))}
                </div>
                {stats.lengths.length > 0 && (
                  <>
                    <h3 className="text-white/60 font-bold text-xs uppercase tracking-wide mt-4 mb-2">Period length</h3>
                    <div className="space-y-1.5">
                      {stats.lengths.slice(-8).map((l) => (
                        <div key={l.from} className="flex items-center gap-2 text-xs">
                          <span className="text-white/30 w-14">{fmt(l.from)}</span>
                          <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-purple-500/50 to-pink-400/50" style={{ width: `${(l.days / maxLen) * 100}%` }} />
                          </div>
                          <span className="text-purple-200/80 font-bold w-8 text-right">{l.days}d</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Wellness insights */}
            {(stats.topSymptoms.length > 0 || stats.flowTotal > 0) && (
              <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5 space-y-4">
                <h2 className="text-white font-black">🌡️ Your body's patterns <span className="text-white/25 text-[10px] font-normal">(last 60 days)</span></h2>
                {stats.topSymptoms.length > 0 && (
                  <div className="space-y-1.5">
                    {stats.topSymptoms.map(([sy, n]) => (
                      <div key={sy} className="flex items-center gap-2 text-xs">
                        <span className="text-white/60 w-28">{SYMPTOM_LABEL[sy] ?? sy}</span>
                        <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-rose-400/50" style={{ width: `${Math.min(100, n * 12)}%` }} />
                        </div>
                        <span className="text-white/30 w-10 text-right">{n} day{n > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                {stats.flowTotal > 0 && (
                  <div>
                    <p className="text-white/40 text-[11px] font-bold uppercase tracking-wide mb-1.5">Flow mix</p>
                    <div className="flex h-3 rounded-full overflow-hidden">
                      {stats.flowLight > 0 && <div className="bg-pink-200/60" style={{ width: `${(stats.flowLight / stats.flowTotal) * 100}%` }} />}
                      {stats.flowMed > 0 && <div className="bg-pink-400/70" style={{ width: `${(stats.flowMed / stats.flowTotal) * 100}%` }} />}
                      {stats.flowHeavy > 0 && <div className="bg-pink-700/80" style={{ width: `${(stats.flowHeavy / stats.flowTotal) * 100}%` }} />}
                    </div>
                    <p className="text-white/25 text-[10px] mt-1">{stats.flowLight} light · {stats.flowMed} medium · {stats.flowHeavy} heavy</p>
                  </div>
                )}
              </div>
            )}

            {/* History + past-period backfill */}
            <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-black">🗓️ Full history</h2>
                <button
                  className="btn btn-xs rounded-xl border border-pink-400/30 bg-pink-500/15 text-pink-100 font-bold"
                  onClick={() => { setPastStart(''); setPastEnd(''); setPastType('hayd'); setPastOpen(true); }}
                >＋ Log a past period</button>
              </div>
              {(summary?.logs ?? []).length === 0 ? (
                <p className="text-white/30 text-xs">Nothing yet — add your last few periods and predictions wake up immediately.</p>
              ) : (
                <div className="space-y-1.5">
                  {(summary?.logs ?? []).map((l) => (
                    <div key={l._id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-xs">
                      <span>{l.type === 'nifas' ? '🤱' : '🌸'}</span>
                      <span className="text-white/70 flex-1">
                        {fmtFull(l.startDate)} — {l.endDate ? fmtFull(l.endDate) : 'ongoing'}
                        {l.endDate && <span className="text-white/25"> · {daysBetween(l.startDate, l.endDate) + 1}d</span>}
                      </span>
                      <button
                        aria-label="Delete entry"
                        className="text-white/25 hover:text-red-300"
                        onClick={() => setPendingDelete({ id: l._id, label: `${fmtFull(l.startDate)} — ${l.endDate ? fmtFull(l.endDate) : 'ongoing'}` })}
                      >🗑</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-white/25 text-[10px] mt-3 leading-relaxed">
                Estimates only — they help you prepare, they never define you. If bleeding patterns worry you,
                speak to a doctor; for the fiqh of unusual bleeding see the istiḥāḍa note on the Cycle page.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Past period modal */}
      {pastOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setPastOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-brand-deep border border-pink-400/25 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-black text-lg">🗓️ Log a past period</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/50 text-xs font-bold" htmlFor="past-start">Started</label>
                <input id="past-start" type="date" value={pastStart} max={today} onChange={(e) => setPastStart(e.target.value)}
                  className="input input-bordered input-sm w-full mt-1 bg-white/5 border-emerald-500/10 text-white" />
              </div>
              <div>
                <label className="text-white/50 text-xs font-bold" htmlFor="past-end">Ended</label>
                <input id="past-end" type="date" value={pastEnd} max={today} onChange={(e) => setPastEnd(e.target.value)}
                  className="input input-bordered input-sm w-full mt-1 bg-white/5 border-emerald-500/10 text-white" />
              </div>
            </div>
            <div className="flex gap-2">
              {(['hayd', 'nifas'] as const).map((t) => (
                <button key={t}
                  className={`flex-1 btn btn-xs rounded-xl ${pastType === t ? 'bg-pink-500/30 border-pink-400/40 text-pink-100' : 'bg-white/5 border-emerald-500/10 text-white/50'}`}
                  onClick={() => setPastType(t)}
                >{t === 'hayd' ? '🌸 Period' : '🤱 Nifās'}</button>
              ))}
            </div>
            <button
              className="w-full btn btn-sm rounded-2xl border-0 text-white font-black bg-gradient-to-r from-pink-500 to-rose-500"
              disabled={!pastStart || !pastEnd || addPast.isPending}
              onClick={() => addPast.mutate({ startDate: pastStart, endDate: pastEnd, type: pastType }, { onSuccess: () => setPastOpen(false) })}
            >
              {addPast.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Add to my history'}
            </button>
            <p className="text-white/25 text-[10px] text-center">Add your last 3–6 periods and the predictions become genuinely yours.</p>
          </div>
        </div>
      )}

      {/* Second confirmation for deletes (app-wide rule) */}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove this cycle?"
        message={pendingDelete ? `${pendingDelete.label} will be removed from your history and predictions.` : ''}
        onConfirm={() => { if (pendingDelete) deleteLog.mutate(pendingDelete.id); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />
    </AnimatedBackground>
  );
}
