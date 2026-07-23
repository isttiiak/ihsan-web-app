import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import QuranTabNav from '../components/QuranTabNav.js';
import { useQuranSummary, useStartKhatam, QURAN_TOTAL_AYAT } from '../hooks/useQuran.js';
import { loadSurahList, locateGlobalAyah, juzOf, type SurahMeta } from '../utils/quranData.js';

/**
 * The Khatam journey — a serial, self-paced read-through of the whole Quran.
 * Scholars across the madhāhib prefer reading in order (tartīb) for a khatam;
 * this tab owns that journey while the Read tab stays free for any surah.
 */
export default function QuranKhatam() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useQuranSummary();
  const startKhatam = useStartKhatam();
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  // Opt-in (Istiak's spec): the journey exists only after the user begins it.
  const khatamStarted = !!summary?.profile.khatamStartedAt || (summary?.profile.currentAyah ?? 0) > 0;

  useEffect(() => {
    let alive = true;
    loadSurahList().then((l) => { if (alive) setSurahs(l); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const pos = useMemo(() => {
    if (!summary || !surahs.length) return null;
    return locateGlobalAyah(summary.profile.currentAyah, surahs);
  }, [summary, surahs]);

  const posMeta = pos ? surahs.find((s) => s.number === pos.surah) : null;
  const pct = summary ? (summary.profile.currentAyah / QURAN_TOTAL_AYAT) * 100 : 0;

  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Khatam Journey</h1>
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-16 space-y-4">
        <QuranTabNav active="khatam" />

        {isLoading || !summary ? (
          <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-10 grid place-items-center">
            <span className="loading loading-spinner loading-lg text-brand-emerald" />
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-6 sm:p-8 border border-brand-emerald/25 bg-gradient-to-br from-brand-emerald/15 via-teal-500/10 to-brand-deep relative overflow-hidden"
            >
              <p className="text-brand-emerald/80 text-xs font-bold uppercase tracking-widest">🕋 Khatam journey</p>
              <h2 className="text-2xl font-black text-white mt-1">
                {pos && posMeta ? <>{posMeta.englishName} <span className="text-white/40 text-base">· āyah {pos.ayah} of {posMeta.numberOfAyahs} · Juz {juzOf(pos.surah, pos.ayah)}</span></> : 'Bismillah — begin your journey'}
              </h2>

              <div className="mt-4 h-3 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-emerald to-teal-400"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-white/40 mt-1.5">
                <span>{summary.profile.currentAyah} / {QURAN_TOTAL_AYAT} āyāt · {pct.toFixed(1)}%</span>
                <span>{summary.estDaysToKhatm ? `≈ ${summary.estDaysToKhatm} days at your pace` : 'read a few days to see your pace'}</span>
              </div>

              {khatamStarted ? (
                <>
                  <button
                    className="mt-5 w-full btn h-13 rounded-2xl border-0 text-white text-base font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
                    onClick={() => { if (pos) navigate(`/quran/read/${pos.surah}?start=${pos.ayah}&mode=khatam`); }}
                    disabled={!pos}
                  >
                    ▶ Continue from {pos ? `${pos.surah}:${pos.ayah}` : '…'}
                  </button>
                  <p className="text-white/30 text-[11px] text-center mt-2">
                    Every āyah you pass moves the bookmark — read at your own calm pace.
                  </p>
                </>
              ) : (
                <>
                  <button
                    className="mt-5 w-full btn h-13 rounded-2xl border-0 text-white text-base font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
                    disabled={startKhatam.isPending}
                    onClick={() => startKhatam.mutate(undefined, {
                      onSuccess: () => navigate('/quran/read/1?start=1&mode=khatam'),
                    })}
                  >
                    🕋 Begin my khatam journey
                  </button>
                  <p className="text-white/30 text-[11px] text-center mt-2">
                    Entirely your choice, at your pace — start whenever your heart is ready.
                    You can reset it anytime from ⚙️ settings.
                  </p>
                </>
              )}
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
                <p className="text-2xl font-black text-brand-gold">⭐ {summary.profile.khatmCount}</p>
                <p className="text-white/35 text-[10px] font-bold uppercase mt-1">khatm completed</p>
              </div>
              <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
                <p className="text-2xl font-black text-brand-emerald">{summary.pace ?? '—'}</p>
                <p className="text-white/35 text-[10px] font-bold uppercase mt-1">āyāt / day (7-day avg)</p>
              </div>
            </div>

            <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
              <h3 className="text-white font-black text-sm mb-2">Why read in order?</h3>
              <p className="text-white/45 text-xs leading-relaxed">
                A khatam moves through the Book the way it was compiled — every surah in its place, nothing
                skipped, nothing forgotten. Keep this journey serial, and use the <b className="text-white/70">Read</b> tab
                whenever your heart needs a specific surah — both count toward your daily goal and streak.
              </p>
              <p className="text-white/30 text-[11px] mt-2">
                "…and recite the Quran with measured recitation." —{' '}
                <a className="underline" href="https://quran.com/73/4" target="_blank" rel="noreferrer">Quran 73:4</a>
              </p>
            </div>
          </>
        )}
      </div>
    </AnimatedBackground>
  );
}
