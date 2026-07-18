import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon,
  BookmarkIcon as BookmarkOutline,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '../store/useAuthStore.js';
import { useQuranSummary, useReadAyat, useToggleBookmark } from '../hooks/useQuran.js';
import { loadSurahList, loadSurahText, ayahAudioUrl, juzOf, locateGlobalAyah, type SurahMeta, type AyahText } from '../utils/quranData.js';
import { celebrateGoal, celebrateKhatm } from '../utils/celebrate.js';

/**
 * The ayah-by-ayah reading room (Istiak's design):
 * one big calm card — Arabic ayah + English meaning — prev/next at the bottom,
 * surah/juz/today-count chips around it, a top-right play button that recites
 * ONLY this ayah (words highlight as it plays; hover highlights without audio),
 * fullscreen for distraction-free reading. Keyboard: ← → navigate · F
 * fullscreen · Esc exit.
 *
 * Modes: free (browse), khatam (advances the khatam bookmark), bundle
 * (a bounded ayah range like Āyatul Kursī).
 */

const FONT_SIZES = ['text-2xl sm:text-3xl', 'text-3xl sm:text-4xl', 'text-4xl sm:text-5xl'];

export default function QuranReader() {
  const { surah: surahParam } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const surahNo = Math.min(114, Math.max(1, Number(surahParam) || 1));
  const mode = (params.get('mode') ?? 'free') as 'free' | 'khatam' | 'bundle';
  const startAyah = Number(params.get('start')) || 1;
  const endAyah = Number(params.get('end')) || null; // bundle bound

  const { data: summary } = useQuranSummary();
  const readAyat = useReadAyat();
  const toggleBookmark = useToggleBookmark();

  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [ayat, setAyat] = useState<AyahText[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0); // index within `ayat`
  const [fullscreen, setFullscreen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [wordIdx, setWordIdx] = useState(-1);
  const fontSize = FONT_SIZES[Number(localStorage.getItem('ihsan_quran_font')) || 1] ?? FONT_SIZES[1]!;

  const cardRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ayat advanced past but not yet flushed to the server
  const pendingRef = useRef(0);
  const seenRef = useRef(new Set<number>());

  const surahMeta = useMemo(() => surahs.find((s) => s.number === surahNo) ?? null, [surahs, surahNo]);
  const current = ayat[idx] ?? null;
  const lastIdx = endAyah ? Math.min(ayat.length - 1, endAyah - 1) : ayat.length - 1;
  const firstIdx = mode === 'bundle' ? startAyah - 1 : 0;

  // ── data ──
  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([loadSurahList(), loadSurahText(surahNo)])
      .then(([list, text]) => {
        if (!alive) return;
        setSurahs(list);
        setAyat(text);
        setIdx(Math.min(text.length - 1, Math.max(0, startAyah - 1)));
        setLoading(false);
      })
      .catch(() => { if (alive) { setLoading(false); toast.error('Could not load the surah — check your connection.', { id: 'quran-load' }); } });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNo]);

  // ── logging: count each NEW ayah the reader moves past, flush in batches ──
  const flush = useCallback(() => {
    const n = pendingRef.current;
    if (n <= 0 || !user) return;
    pendingRef.current = 0;
    readAyat.mutate(
      { count: n, surah: surahNo, advanceKhatm: mode === 'khatam' },
      {
        onSuccess: (r) => {
          if (r.khatmCompleted) celebrateKhatm();
        },
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, surahNo, mode]);

  useEffect(() => () => flush(), [flush]); // flush on unmount / surah change

  const markRead = useCallback((ayahIdx: number) => {
    const a = ayat[ayahIdx];
    if (!a || seenRef.current.has(a.number)) return;
    seenRef.current.add(a.number);
    pendingRef.current += 1;
    const before = (summary?.todayAyat ?? 0) + pendingRef.current - 1;
    const goal = summary?.profile.dailyGoalAyat ?? 20;
    if (before < goal && before + 1 >= goal) celebrateGoal();
    if (pendingRef.current >= 5) flush();
  }, [ayat, flush, summary]);

  // ── audio: play ONLY the current ayah, highlight words while it runs ──
  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    if (wordTimerRef.current) clearInterval(wordTimerRef.current);
    setPlaying(false);
    setWordIdx(-1);
  }, []);

  const playAyah = useCallback(() => {
    if (!current) return;
    if (playing) { stopAudio(); return; }
    const a = new Audio(ayahAudioUrl(current.number));
    audioRef.current = a;
    const words = current.arabic.split(' ').length;
    a.addEventListener('loadedmetadata', () => {
      // Even word pacing across the recitation — simple, calm, good enough
      const per = (a.duration * 1000) / Math.max(1, words);
      let w = 0;
      setWordIdx(0);
      wordTimerRef.current = setInterval(() => {
        w += 1;
        if (w >= words) { if (wordTimerRef.current) clearInterval(wordTimerRef.current); return; }
        setWordIdx(w);
      }, per);
    });
    a.addEventListener('ended', () => { stopAudio(); }); // ONE ayah, then stop
    a.addEventListener('error', () => { stopAudio(); toast.error('Audio unavailable — try again.', { id: 'ayah-audio' }); });
    void a.play().then(() => setPlaying(true)).catch(() => toast.error('Tap again to allow audio.', { id: 'ayah-audio' }));
  }, [current, playing, stopAudio]);

  // ── navigation ──
  const goNext = useCallback(() => {
    stopAudio();
    if (idx < lastIdx) {
      markRead(idx); // moving past the current ayah = it was read
      setIdx(idx + 1);
    } else {
      markRead(idx);
      flush();
      if (mode === 'bundle') {
        toast.success('Bundle complete — may it protect and bless you 🤲', { id: 'bundle-done' });
      } else if (surahNo < 114) {
        navigate(`/quran/read/${surahNo + 1}?mode=${mode}`);
      }
    }
  }, [idx, lastIdx, markRead, stopAudio, flush, mode, surahNo, navigate]);

  const goPrev = useCallback(() => {
    stopAudio();
    if (idx > firstIdx) setIdx(idx - 1);
  }, [idx, firstIdx, stopAudio]);

  // ── fullscreen + keyboard ──
  const toggleFullscreen = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => setFullscreen(true));
    } else {
      void document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key.toLowerCase() === 'f') { e.preventDefault(); toggleFullscreen(); }
      // Esc exits fullscreen natively
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, toggleFullscreen]);

  useEffect(() => stopAudio, [idx, stopAudio]); // stop when the ayah changes

  const isBookmarked = !!summary?.bookmarks?.some((b) => b.surah === surahNo && b.ayah === (current?.numberInSurah ?? 0));
  const todayCount = (summary?.todayAyat ?? 0) + pendingRef.current;
  const khatamPos = mode === 'khatam' && summary && surahs.length
    ? locateGlobalAyah(summary.profile.currentAyah, surahs) : null;

  const words = useMemo(() => (current ? current.arabic.split(' ') : []), [current]);

  return (
    <div className="min-h-screen bg-brand-void pb-16">
      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4">

        {/* top bar */}
        <div className="flex items-center justify-between text-xs">
          <Link to={mode === 'khatam' ? '/quran/khatam' : '/quran'} className="text-white/40 hover:text-white">← Back</Link>
          <div className="flex items-center gap-2 text-white/40">
            {mode === 'khatam' && <span className="px-2 py-0.5 rounded-full bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30 font-bold">Khatam journey</span>}
            {mode === 'bundle' && <span className="px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 font-bold">Special selection</span>}
            <span className="hidden sm:inline">⌨️ ← → · F fullscreen</span>
          </div>
        </div>

        {/* info chips */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 font-bold">
            {surahNo}. {surahMeta?.englishName ?? '…'} <span className="text-white/30">· {surahMeta?.numberOfAyahs ?? '–'} āyāt</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
            Juz {current ? juzOf(surahNo, current.numberInSurah) : '–'}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/25 text-brand-emerald font-bold">
            📖 {todayCount} āyāt today{summary ? ` / ${summary.profile.dailyGoalAyat} goal` : ''}
          </span>
          {khatamPos && (
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">
              Khatam at {khatamPos.surah}:{khatamPos.ayah}
            </span>
          )}
        </div>

        {/* ── THE CARD ── */}
        <div
          ref={cardRef}
          className={`relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1b17] via-[#0a1412] to-[#0d1420] overflow-hidden ${fullscreen ? 'fixed inset-0 z-50 rounded-none grid place-items-center p-6 sm:p-16' : 'p-6 sm:p-10'}`}
        >
          {/* top-right controls */}
          <div className={`absolute top-4 right-4 flex items-center gap-2 z-10`}>
            <button
              aria-label={playing ? 'Stop recitation' : 'Recite this ayah'}
              title="Recite only this ayah"
              onClick={playAyah}
              className={`w-10 h-10 rounded-full grid place-items-center border transition-all ${playing ? 'bg-brand-emerald text-white border-brand-emerald' : 'bg-white/5 text-brand-emerald border-white/10 hover:border-brand-emerald/50'}`}
            >
              {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 ml-0.5" />}
            </button>
            {user && (
              <button
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this ayah'}
                onClick={() => current && toggleBookmark.mutate({ surah: surahNo, ayah: current.numberInSurah })}
                className="w-10 h-10 rounded-full grid place-items-center border bg-white/5 border-white/10 text-brand-gold hover:border-brand-gold/50"
              >
                {isBookmarked ? <BookmarkSolid className="w-4 h-4" /> : <BookmarkOutline className="w-4 h-4" />}
              </button>
            )}
            <button
              aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-full grid place-items-center border bg-white/5 border-white/10 text-white/50 hover:text-white"
            >
              {fullscreen ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
            </button>
          </div>

          {loading || !current ? (
            <div className="min-h-[40vh] grid place-items-center">
              <span className="loading loading-spinner loading-lg text-brand-emerald" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.number}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className={`${fullscreen ? 'max-w-4xl' : ''} w-full text-center space-y-6 sm:space-y-8 pt-8`}
              >
                <p className="text-white/25 text-xs font-bold tracking-widest">
                  {surahMeta?.name} · {current.numberInSurah}/{surahMeta?.numberOfAyahs}
                </p>

                {/* Arabic — word hover highlight; timed highlight while reciting */}
                <p dir="rtl" lang="ar" className={`${fontSize} leading-[2.2] font-serif text-[#e8e2d0]`}>
                  {words.map((w, i) => (
                    <span
                      key={i}
                      className={`transition-colors duration-150 rounded px-0.5 cursor-default ${playing && i === wordIdx ? 'bg-brand-emerald/35 text-white' : 'hover:bg-white/10'}`}
                    >
                      {w}{' '}
                    </span>
                  ))}
                </p>

                <p className="text-white/55 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  {current.english}
                </p>
                <p className="text-white/20 text-[10px]">Ṣaḥīḥ International · <a className="underline" href={`https://quran.com/${surahNo}/${current.numberInSurah}`} target="_blank" rel="noreferrer">quran.com/{surahNo}/{current.numberInSurah}</a></p>
              </motion.div>
            </AnimatePresence>
          )}

          {/* prev / next */}
          {!loading && current && (
            <div className={`flex items-center justify-between ${fullscreen ? 'absolute bottom-8 left-8 right-8' : 'mt-8'}`}>
              <button
                aria-label="Previous ayah"
                onClick={goPrev}
                disabled={idx <= firstIdx}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white disabled:opacity-20 text-sm font-bold"
              >
                <ChevronLeftIcon className="w-4 h-4" /> Previous
              </button>
              <button
                aria-label="Next ayah"
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-brand-emerald/90 hover:bg-brand-emerald text-white text-sm font-black border-0"
              >
                {idx >= lastIdx ? (mode === 'bundle' ? 'Finish 🤲' : surahNo < 114 ? 'Next surah' : 'Finish') : 'Next'}
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* jump within surah */}
        {!loading && ayat.length > 0 && mode !== 'bundle' && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <label htmlFor="jump-ayah" className="font-bold">Jump to āyah</label>
            <select
              id="jump-ayah"
              className="select select-xs bg-white/5 border-white/10 text-white/70 rounded-lg"
              value={idx + 1}
              onChange={(e) => { stopAudio(); setIdx(Number(e.target.value) - 1); }}
            >
              {ayat.map((a) => <option key={a.number} value={a.numberInSurah}>{a.numberInSurah}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
