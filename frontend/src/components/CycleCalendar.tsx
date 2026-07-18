import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { CycleSummary } from '../hooks/useCycle.js';

/**
 * Month calendar for Rayhanah Cycle:
 *  · rose-filled days = logged hayd (purple = nifas)
 *  · dashed rose ring = predicted next period window
 *  · white ring       = today
 *  · small dot        = flow note intensity (light/medium/heavy)
 */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function shiftStr(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return ymd(d);
}

const FLOW_DOT: Record<string, string> = {
  light: 'rgba(251,207,232,0.9)',   // pink-200
  medium: 'rgba(244,114,182,0.95)', // pink-400
  heavy: 'rgba(190,24,93,1)',       // pink-700
};

export default function CycleCalendar({ summary, today }: { summary: CycleSummary; today: string }) {
  const [month, setMonth] = useState(today.substring(0, 7)); // YYYY-MM

  const inLoggedCycle = (day: string): 'hayd' | 'nifas' | null => {
    for (const l of summary.logs) {
      const end = l.endDate ?? (summary.active ? today : l.startDate);
      if (l.startDate <= day && day <= end) return l.type;
    }
    return null;
  };

  // Predicted window: nextStart .. nextStart + avgPeriodDays - 1
  const predictedDays = new Set<string>();
  if (summary.prediction.nextStart) {
    for (let i = 0; i < Math.max(1, summary.prediction.avgPeriodDays); i++) {
      predictedDays.add(shiftStr(summary.prediction.nextStart, i));
    }
  }
  const noteByDate = new Map(summary.days.map((d) => [d.date, d]));

  const [y, m] = month.split('-').map(Number);
  const first = new Date(y!, m! - 1, 1);
  const daysInMonth = new Date(y!, m!, 0).getDate();
  const blanks = first.getDay();
  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-black">🌸 Cycle calendar</h2>
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous month"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
            onClick={() => { const d = new Date(y!, m! - 2, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }}
          ><ChevronLeftIcon className="w-4 h-4" /></button>
          <span className="text-white/70 text-sm font-bold w-32 text-center">{monthLabel}</span>
          <button
            aria-label="Next month"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
            onClick={() => { const d = new Date(y!, m!, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }}
          ><ChevronRightIcon className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-white/25 text-[9px] font-bold uppercase py-1">{d}</span>
        ))}
        {Array.from({ length: blanks }).map((_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = `${month}-${String(i + 1).padStart(2, '0')}`;
          const cycleType = inLoggedCycle(day);
          const predicted = predictedDays.has(day);
          const isToday = day === today;
          const note = noteByDate.get(day);
          return (
            <div
              key={day}
              title={cycleType ? (cycleType === 'nifas' ? 'Nifās day' : 'Period day') : predicted ? 'Expected period' : undefined}
              className={[
                'relative aspect-square rounded-xl grid place-items-center text-[11px] font-bold transition-all',
                cycleType === 'hayd' ? 'bg-pink-500/35 text-pink-100' :
                cycleType === 'nifas' ? 'bg-purple-500/35 text-purple-100' :
                predicted ? 'border border-dashed border-pink-400/50 text-pink-200/80' :
                'text-white/45 bg-white/[0.03]',
                isToday ? 'ring-2 ring-white/70' : '',
              ].join(' ')}
            >
              {i + 1}
              {note?.flow && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ background: FLOW_DOT[note.flow] }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-white/35">
        <span><span className="inline-block w-2.5 h-2.5 rounded bg-pink-500/50 align-middle mr-1" />period</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded bg-purple-500/50 align-middle mr-1" />nifās</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded border border-dashed border-pink-400/60 align-middle mr-1" />expected</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded ring-2 ring-white/70 align-middle mr-1" />today</span>
      </div>
    </div>
  );
}
