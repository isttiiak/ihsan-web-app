import { useEffect, useMemo, useState } from 'react';
import AnimatedBackground from '../components/AnimatedBackground.js';
import QuranTabNav from '../components/QuranTabNav.js';
import { useQuranSummary, useQuranHistory, QURAN_TOTAL_AYAT } from '../hooks/useQuran.js';
import { loadSurahList, type SurahMeta } from '../utils/quranData.js';

/** The whole Quran journey in numbers — reading, listening, khatam, favourites. */
export default function QuranAnalytics() {
  const { data: summary } = useQuranSummary();
  const { data: history } = useQuranHistory(30, true);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);

  useEffect(() => {
    let alive = true;
    loadSurahList().then((l) => { if (alive) setSurahs(l); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const nameOf = (n: number) => surahs.find((s) => s.number === n)?.englishName ?? `Surah ${n}`;

  const chart = useMemo(() => {
    const byDate = new Map((history ?? []).map((h) => [h.date, h.units]));
    const days: Array<{ date: string; units: number }> = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: k, units: byDate.get(k) ?? 0 });
    }
    const max = Math.max(1, ...days.map((d) => d.units));
    const activeDays = days.filter((d) => d.units > 0).length;
    return { days, max, activeDays };
  }, [history]);

  const khatmPct = summary ? (summary.profile.currentAyah / QURAN_TOTAL_AYAT) * 100 : 0;
  const maxTop = Math.max(1, ...(summary?.topSurahs ?? []).map((t) => t.ayat));

  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Quran Analytics</h1>
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-16 space-y-4">
        <QuranTabNav active="analytics" />

        {/* tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
            <p className="text-2xl font-black text-brand-emerald">{summary?.stats.allTimeUnits ?? '—'}</p>
            <p className="text-white/35 text-[10px] font-bold uppercase mt-1">āyāt all-time</p>
          </div>
          <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
            <p className="text-2xl font-black text-brand-gold">🔥 {summary?.streak ?? 0}</p>
            <p className="text-white/35 text-[10px] font-bold uppercase mt-1">day streak (best {summary?.bestStreak ?? 0})</p>
          </div>
          <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
            <p className="text-2xl font-black text-teal-300">{summary?.stats.last30Units ?? 0}</p>
            <p className="text-white/35 text-[10px] font-bold uppercase mt-1">āyāt · last 30 days</p>
          </div>
          <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
            <p className="text-2xl font-black text-purple-300">⭐ {summary?.profile.khatmCount ?? 0}</p>
            <p className="text-white/35 text-[10px] font-bold uppercase mt-1">khatm · now {khatmPct.toFixed(0)}%</p>
          </div>
        </div>

        {/* 30-day chart */}
        <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-black">📈 Last 30 days</h2>
            <span className="text-white/30 text-xs">{chart.activeDays}/30 days with Quran</span>
          </div>
          <div className="flex items-end gap-[3px] h-28">
            {chart.days.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.units} āyāt`}
                className={`flex-1 rounded-t ${d.units > 0 ? 'bg-gradient-to-t from-emerald-600/70 to-teal-400/70' : 'bg-white/5'}`}
                style={{ height: `${Math.max(4, (d.units / chart.max) * 100)}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-white/25 mt-1">
            <span>{chart.days[0]?.date.slice(5)}</span>
            <span>today</span>
          </div>
        </div>

        {/* top surahs */}
        <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
          <h2 className="text-white font-black mb-3">💚 Your most-read surahs</h2>
          {(summary?.topSurahs ?? []).length === 0 ? (
            <p className="text-white/30 text-xs">Read in the new āyah reader and your favourites appear here.</p>
          ) : (
            <div className="space-y-1.5">
              {(summary?.topSurahs ?? []).map((t, i) => (
                <div key={t.surah} className="flex items-center gap-2 text-xs">
                  <span className="w-5 text-white/30 font-black">{i + 1}</span>
                  <span className="text-white/70 font-bold w-32 truncate">{nameOf(t.surah)}</span>
                  <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-teal-400/60" style={{ width: `${(t.ayat / maxTop) * 100}%` }} />
                  </div>
                  <span className="text-brand-emerald font-bold w-14 text-right">{t.ayat} āyāt</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* khatam projection */}
        <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
          <h2 className="text-white font-black mb-2">🕋 Khatam projection</h2>
          <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-emerald to-teal-400" style={{ width: `${khatmPct}%` }} />
          </div>
          <p className="text-white/40 text-xs mt-2">
            {summary?.estDaysToKhatm
              ? <>At your 7-day pace ({summary.pace} āyāt/day) you finish in <b className="text-brand-emerald">≈ {summary.estDaysToKhatm} days</b>, in shāʾ Allāh.</>
              : 'Read a few days in a row and your finish estimate appears here.'}
          </p>
        </div>
      </div>
    </AnimatedBackground>
  );
}
