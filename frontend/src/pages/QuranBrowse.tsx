import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground.js';
import QuranTabNav from '../components/QuranTabNav.js';
import { loadSurahList, type SurahMeta } from '../utils/quranData.js';

/**
 * Free reading — pick ANY surah, any time (the flexibility Istiak asked for:
 * "user might need to read some of the special surah in a specific time").
 * Everything read here still counts toward the daily goal and streak.
 */
export default function QuranBrowse() {
  const navigate = useNavigate();
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSurahList().then((l) => { if (alive) setSurahs(l); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return surahs;
    return surahs.filter((s) =>
      s.englishName.toLowerCase().includes(needle) ||
      s.englishNameTranslation.toLowerCase().includes(needle) ||
      String(s.number) === needle
    );
  }, [surahs, q]);

  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Read the Quran</h1>
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-16 space-y-4">
        <QuranTabNav active="read" />

        <input
          type="search"
          placeholder="Search surah by name or number…"
          aria-label="Search surahs"
          className="input input-bordered w-full bg-white/5 border-white/10 text-white rounded-2xl"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {error ? (
          <p className="text-white/40 text-sm text-center py-8">Couldn't load the surah list — check your connection.</p>
        ) : surahs.length === 0 ? (
          <div className="grid place-items-center py-10"><span className="loading loading-spinner loading-lg text-brand-emerald" /></div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((s) => (
              <button
                key={s.number}
                className="w-full flex items-center gap-3 rounded-2xl bg-brand-deep/70 border border-brand-border hover:border-brand-emerald/40 px-4 py-3 text-left transition-all"
                onClick={() => navigate(`/quran/read/${s.number}`)}
              >
                <span className="w-9 h-9 rounded-xl bg-brand-emerald/10 border border-brand-emerald/25 grid place-items-center text-brand-emerald text-xs font-black shrink-0">
                  {s.number}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-white font-bold text-sm">{s.englishName}</span>
                  <span className="block text-white/35 text-xs truncate">{s.englishNameTranslation} · {s.numberOfAyahs} āyāt · {s.revelationType}</span>
                </span>
                <span className="text-xl text-white/70 font-serif" dir="rtl">{s.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-white/30 text-sm text-center py-6">No surah matches "{q}"</p>}
          </div>
        )}
      </div>
    </AnimatedBackground>
  );
}
