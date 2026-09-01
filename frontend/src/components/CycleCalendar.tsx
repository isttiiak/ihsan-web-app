import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { CycleSummary } from '../hooks/useCycle.js';
import { formatLocaleDate } from '../utils/localeDate.js';

/**
 * Month calendar for Rayhanah Cycle:
 *  · rose-filled days = logged hayd (purple = nifas)
 *  · dashed rose ring = predicted next period window
 *  · teal fill        = predicted fertile window (ovulation day brighter)
 *  · gold fill        = predicted PMS window
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
  light: 'rgba(212,131,158,0.5)',
  medium: 'rgba(212,131,158,0.8)',
  heavy: 'rgba(176,106,132,1)',
};

export default function CycleCalendar({ summary, today }: { summary: CycleSummary; today: string }) {
  const { t } = useTranslation();
  const [month, setMonth] = useState(today.substring(0, 7)); // YYYY-MM

  const inLoggedCycle = (day: string): 'hayd' | 'nifas' | null => {
    for (const l of summary.logs) {
      const end = l.endDate ?? (summary.active ? today : l.startDate);
      if (l.startDate <= day && day <= end) return l.type;
    }
    return null;
  };

  // Predicted windows for the NEXT 3 cycles
  const predictedDays = new Set<string>();
  const fertileDays = new Set<string>();
  const ovulationDays = new Set<string>();
  const pmsDays = new Set<string>();

  if (summary.prediction.nextStart) {
    const cycleLen = Math.max(1, summary.prediction.avgCycleDays || 28);
    const hasPrediction = summary.prediction.basedOnCycles > 0;
    for (let w = 0; w < 3; w++) {
      const windowStart = shiftStr(summary.prediction.nextStart, w * cycleLen);
      for (let i = 0; i < Math.max(1, summary.prediction.avgPeriodDays); i++) {
        predictedDays.add(shiftStr(windowStart, i));
      }
      if (hasPrediction) {
        // Ovulation ~14 days before the predicted period start
        const ovDay = shiftStr(windowStart, -14);
        ovulationDays.add(ovDay);
        for (let i = -2; i <= 2; i++) fertileDays.add(shiftStr(ovDay, i));
        // PMS window: 7 days before period
        for (let i = -7; i <= -1; i++) pmsDays.add(shiftStr(windowStart, i));
      }
    }
  }
  const noteByDate = new Map(summary.days.map((d) => [d.date, d]));

  const [y, m] = month.split('-').map(Number);
  const first = new Date(y!, m! - 1, 1);
  const daysInMonth = new Date(y!, m!, 0).getDate();
  const blanks = first.getDay();
  const monthLabel = formatLocaleDate(first, { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-black">{t('cycleCalendar.title')}</h2>
        <div className="flex items-center gap-1">
          <button
            aria-label={t('cycleCalendar.prevMonth', 'Previous month')}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
            onClick={() => { const d = new Date(y!, m! - 2, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }}
          ><ChevronLeftIcon className="w-4 h-4" /></button>
          <span className="text-white/70 text-sm font-bold w-32 text-center">{monthLabel}</span>
          <button
            aria-label={t('cycleCalendar.nextMonth', 'Next month')}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
            onClick={() => { const d = new Date(y!, m!, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }}
          ><ChevronRightIcon className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {(t('cycleCalendar.weekdays', { returnObjects: true }) as string[]).map((d, i) => (
          <span key={i} className="text-white/25 text-[9px] font-bold uppercase py-1">{d}</span>
        ))}
        {Array.from({ length: blanks }).map((_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = `${month}-${String(i + 1).padStart(2, '0')}`;
          const cycleType = inLoggedCycle(day);
          const predicted = predictedDays.has(day);
          const isToday = day === today;
          const note = noteByDate.get(day);
          // Fertile/ovulation/PMS only show when NOT inside a logged or predicted period
          const isFertile = !cycleType && !predicted && fertileDays.has(day);
          const isOvulation = !cycleType && !predicted && ovulationDays.has(day);
          const isPms = !cycleType && !predicted && !isFertile && pmsDays.has(day);
          return (
            <div
              key={day}
              title={
                cycleType ? (cycleType === 'nifas' ? t('cycleCalendar.nifasDay', 'Nifas day') : t('cycleCalendar.periodDay', 'Period day'))
                : predicted ? t('cycleCalendar.expectedPeriod')
                : isOvulation ? t('cycleCalendar.estimatedOvulation')
                : isFertile ? t('cycleCalendar.fertileWindow')
                : isPms ? t('cycleCalendar.pmsWindow')
                : undefined
              }
              className={[
                'relative aspect-square rounded-xl grid place-items-center text-[11px] font-bold transition-all',
                cycleType === 'hayd' ? 'bg-brand-pink/30 text-brand-pink' :
                cycleType === 'nifas' ? 'bg-brand-warm/30 text-brand-warm' :
                predicted ? 'border border-dashed border-brand-pink/50 text-brand-pink/80' :
                isOvulation ? 'bg-brand-info/30 text-brand-info ring-1 ring-brand-info/40' :
                isFertile ? 'bg-brand-info/15 text-brand-info/80' :
                isPms ? 'bg-brand-gold/10 text-brand-gold/80' :
                'text-white/40 bg-white/[0.03]',
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

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-white/30">
        <span><span className="inline-block w-2.5 h-2.5 rounded bg-brand-pink/50 align-middle mr-1" />{t('cycleCalendar.legendPeriod')}</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded bg-brand-warm/50 align-middle mr-1" />{t('cycleCalendar.legendNifas')}</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded border border-dashed border-brand-pink/60 align-middle mr-1" />{t('cycleCalendar.legendExpected')}</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded bg-brand-info/30 align-middle mr-1" />{t('cycleCalendar.legendFertile')}</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded bg-brand-gold/15 align-middle mr-1" />{t('cycleCalendar.legendPms')}</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded ring-2 ring-white/70 align-middle mr-1" />{t('common.today')}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[10px] text-white/30">
        <span className="text-white/25">{t('cycleCalendar.flowNotes')}:</span>
        <span><span className="inline-block w-1.5 h-1.5 rounded-full align-middle mr-1" style={{ background: FLOW_DOT.light }} />{t('cycleCalendar.flowLight')}</span>
        <span><span className="inline-block w-1.5 h-1.5 rounded-full align-middle mr-1" style={{ background: FLOW_DOT.medium }} />{t('cycleCalendar.flowMedium')}</span>
        <span><span className="inline-block w-1.5 h-1.5 rounded-full align-middle mr-1" style={{ background: FLOW_DOT.heavy }} />{t('cycleCalendar.flowHeavy')}</span>
      </div>
    </div>
  );
}
