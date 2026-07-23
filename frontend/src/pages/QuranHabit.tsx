import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import QuranTabNav from '../components/QuranTabNav.js';
import { useQuranSummary, useStartKhatam, useToggleDuaBookmark, QURAN_TOTAL_AYAT } from '../hooks/useQuran.js';
import { loadSurahList, locateGlobalAyah, type SurahMeta } from '../utils/quranData.js';
import { SPECIAL_SURAHS, AYAH_BUNDLES, QURANIC_DUAS } from '../utils/quranMeta.js';

/**
 * Quran home (v4) — the overview room. Manual page input is GONE (Istiak's
 * spec): reading happens in the ayah reader (Khatam/Read tabs), listening in
 * the Listen tab, and everything flows into ONE daily ayat goal + streak.
 */
export default function QuranHabit() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useQuranSummary();
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);

  useEffect(() => {
    let alive = true;
    loadSurahList().then((l) => { if (alive) setSurahs(l); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Deep link from a finished duʿā: /quran#duas lands on the dua section
  useEffect(() => {
    if (window.location.hash === '#duas') {
      const t = setTimeout(() => document.getElementById('duas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
      return () => clearTimeout(t);
    }
  }, []);

  const startKhatam = useStartKhatam();
  const toggleDua = useToggleDuaBookmark();
  const nameOf = (n: number) => surahs.find((s) => s.number === n)?.englishName ?? `Surah ${n}`;
  // Goal is OPT-IN (0 = not set); khatam starts only when the user says so.
  const goal = summary?.profile.dailyGoalAyat ?? 0;
  const today = summary?.todayAyat ?? 0;
  const pct = goal > 0 ? Math.min(100, (today / goal) * 100) : 0;
  const khatamStarted = !!summary?.profile.khatamStartedAt || (summary?.profile.currentAyah ?? 0) > 0;
  const savedDuas = summary?.profile.savedDuas ?? [];
  const khatmPct = summary ? (summary.profile.currentAyah / QURAN_TOTAL_AYAT) * 100 : 0;
  const pos = useMemo(() => (summary && surahs.length ? locateGlobalAyah(summary.profile.currentAyah, surahs) : null), [summary, surahs]);
  const maxLast7 = Math.max(1, ...(summary?.last7 ?? []).map((d) => d.units));

  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Quran Habit</h1>
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-16 space-y-4">
        <QuranTabNav active="home" />

        {/* ── Today hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 border border-brand-emerald/20 bg-gradient-to-br from-brand-emerald/10 via-teal-500/10 to-brand-deep"
        >
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90" aria-hidden>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - pct / 100) }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-xl font-black text-white leading-none">{isLoading ? '…' : today}</p>
                  <p className="text-[9px] text-white/40 font-bold">{goal > 0 ? `of ${goal} ayat` : 'āyāt today'}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black">{summary?.goalMet ? 'Goal reached — ma sha Allah! 🌟' : "Today's reading"}</p>
              <p className="text-white/40 text-xs mt-1 leading-relaxed">
                {goal > 0
                  ? 'Ayat from khatam, free reading, special selections and listening all count as one.'
                  : 'No daily goal yet — reading still counts. Set one in ⚙️ settings whenever you’re ready.'}
              </p>
              {/* stacked on phones — these two buttons were overflowing the card */}
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                {khatamStarted ? (
                  <button className="btn btn-sm w-full sm:w-auto rounded-xl border-0 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500"
                    onClick={() => { if (pos) navigate(`/quran/read/${pos.surah}?start=${pos.ayah}&mode=khatam`); else navigate('/quran/khatam'); }}>
                    ▶ Continue khatam
                  </button>
                ) : (
                  <button className="btn btn-sm w-full sm:w-auto rounded-xl border-0 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500"
                    disabled={startKhatam.isPending}
                    onClick={() => startKhatam.mutate(undefined, { onSuccess: () => navigate('/quran/khatam') })}>
                    🕋 Begin khatam journey
                  </button>
                )}
                <Link to="/quran/browse" className="btn btn-sm w-full sm:w-auto rounded-xl bg-white/5 border-emerald-500/10 text-white/70 font-bold">
                  Pick a surah
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── streak + khatam mini — each card gets its OWN color so sections
               are recognizable at a glance (Istiak's spec) ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.05] p-4">
            <p className="text-white font-black text-sm">🔥 {summary?.streak ?? 0}-day streak</p>
            <div className="flex items-end gap-1 h-10 mt-2">
              {(summary?.last7 ?? []).map((d) => (
                <div key={d.date} title={`${d.date}: ${d.units} ayat`}
                  className={`flex-1 rounded-t ${d.units > 0 ? 'bg-brand-gold/70' : 'bg-white/10'}`}
                  style={{ height: `${Math.max(10, (d.units / maxLast7) * 100)}%` }} />
              ))}
            </div>
            <p className="text-white/25 text-[10px] mt-1">best: {summary?.bestStreak ?? 0} days</p>
          </div>
          <Link to="/quran/khatam" className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4 hover:border-emerald-400/50 transition-all">
            <p className="text-white font-black text-sm">🕋 Khatam · {khatmPct.toFixed(1)}%</p>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-2.5">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-emerald to-teal-400" style={{ width: `${khatmPct}%` }} />
            </div>
            <p className="text-white/25 text-[10px] mt-1.5">
              {pos ? `at ${nameOf(pos.surah)} ${pos.surah}:${pos.ayah}` : 'begin your journey'} · ⭐ {summary?.profile.khatmCount ?? 0} completed
            </p>
          </Link>
        </div>

        {/* Top surahs moved to the Analytics tab (Istiak's decision) —
            completion counts are an insight, not a homepage feature. */}

        {/* ── special surahs ── */}
        <div className="rounded-3xl border border-purple-500/25 bg-purple-500/[0.05] p-5">
          <h2 className="text-white font-black text-sm mb-3">🌟 Beloved surahs</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {SPECIAL_SURAHS.map((sp) => (
              <button key={sp.surah}
                className="rounded-2xl bg-white/[0.03] border border-transparent hover:border-brand-gold/40 p-3 text-left transition-all"
                onClick={() => navigate(`/quran/read/${sp.surah}?mode=single`)}
              >
                <p className="text-white/80 text-sm font-bold">{sp.emoji} {sp.name} <span className="text-white/25 font-normal">· {sp.surah}</span></p>
                <p className="text-white/40 text-[11px] mt-1 leading-relaxed">{sp.note}</p>
                {sp.ref && (
                  <a className="text-brand-gold/60 text-[10px] underline" href={sp.ref.url} target="_blank" rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}>{sp.ref.text}</a>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── ayah bundles ── */}
        <div className="rounded-3xl border border-cyan-500/25 bg-cyan-500/[0.05] p-5">
          <h2 className="text-white font-black text-sm mb-1">🛡️ Protection & light — ayah selections</h2>
          <p className="text-white/30 text-[11px] mb-3">Short, authentic selections the Prophet ﷺ taught us to hold onto.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {AYAH_BUNDLES.map((b) => (
              <button key={b.id}
                className="rounded-2xl bg-white/[0.03] border border-transparent hover:border-brand-emerald/40 p-3 text-left transition-all"
                onClick={() => navigate(`/quran/read/${b.surah}?start=${b.fromAyah}&end=${b.toAyah}&mode=bundle`)}
              >
                <p className="text-white/80 text-sm font-bold">{b.emoji} {b.title} <span className="text-white/25 font-normal">· {b.surah}:{b.fromAyah}{b.toAyah !== b.fromAyah ? `–${b.toAyah}` : ''}</span></p>
                <p className="text-white/40 text-[11px] mt-1 leading-relaxed">{b.virtue}</p>
                <a className="text-brand-emerald/60 text-[10px] underline" href={b.ref.url} target="_blank" rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}>{b.ref.text}</a>
              </button>
            ))}
          </div>
        </div>

        {/* ── duas from the Quran — the prophets' own words, each with its story ── */}
        <div id="duas" className="rounded-3xl border border-amber-500/25 bg-amber-500/[0.05] p-5 scroll-mt-20">
          <h2 className="text-white font-black text-sm mb-1">🤲 Duas from the Quran</h2>
          <p className="text-white/30 text-[11px] mb-3">Supplications Allah Himself relates — open one to read it with its story and reference.</p>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {QURANIC_DUAS.map((d) => {
              const saved = savedDuas.includes(d.id);
              return (
                <div key={d.id}
                  className="group flex items-center gap-2.5 rounded-xl bg-white/5 border border-transparent hover:border-brand-gold/30 hover:bg-white/[0.06] px-3 py-2 transition-all cursor-pointer"
                  onClick={() => navigate(`/quran/read/${d.surah}?start=${d.fromAyah}&end=${d.toAyah}&mode=bundle&dua=${d.id}`)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/quran/read/${d.surah}?start=${d.fromAyah}&end=${d.toAyah}&mode=bundle&dua=${d.id}`); }}
                >
                  <span className="group-hover:scale-110 transition-transform">{d.emoji}</span>
                  <span className="flex-1 text-white/60 group-hover:text-white/80 text-xs transition-colors">{d.title}</span>
                  <span className="text-white/25 text-[10px]">{d.surah}:{d.fromAyah}</span>
                  <button
                    aria-label={saved ? `Remove ${d.title} from saved duas` : `Save ${d.title}`}
                    className={`text-sm transition-all ${saved ? 'text-brand-gold' : 'text-white/20 hover:text-brand-gold/70'}`}
                    onClick={(e) => { e.stopPropagation(); toggleDua.mutate(d.id); }}
                  >{saved ? '🔖' : '🏷️'}</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Browse all surahs lives on the dedicated Read tab (no duplicate list here). */}
        <Link to="/quran/browse" className="block rounded-3xl border border-indigo-500/25 bg-indigo-500/[0.05] p-4 text-center hover:border-indigo-400/50 transition-all">
          <span className="text-white/70 text-sm font-bold">📚 Browse all 114 surahs →</span>
        </Link>

        {/* virtue footer */}
        <p className="text-white/30 text-[11px] leading-relaxed px-1">
          "Whoever recites a letter from the Book of Allah will have a reward, and the reward is multiplied
          by ten." — <a className="underline" href="https://sunnah.com/tirmidhi:2910" target="_blank" rel="noreferrer">Tirmidhi 2910 (sahih)</a>.
          "The best among you are those who learn the Quran and teach it." —{' '}
          <a className="underline" href="https://sunnah.com/bukhari:5027" target="_blank" rel="noreferrer">Bukhari 5027</a>.
        </p>
      </div>

    </AnimatedBackground>
  );
}
