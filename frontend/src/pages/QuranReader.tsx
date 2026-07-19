import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon,
  BookmarkIcon as BookmarkOutline, SpeakerWaveIcon, SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '../store/useAuthStore.js';
import { useQuranSummary, useReadAyat, useToggleBookmark } from '../hooks/useQuran.js';
import { useAiReflect } from '../hooks/useAi.js';
import { AiPanel, AiThinking, AiDisclaimer, AiBadge } from '../components/ai/AiFlair.js';
import { loadSurahList, loadSurahText, ayahAudioUrl, juzOf, locateGlobalAyah, selectedTranslations, TRANSLATIONS, type SurahMeta, type AyahText } from '../utils/quranData.js';
import { celebrateGoal, celebrateKhatm, celebrateSmall } from '../utils/celebrate.js';

/**
 * The ayah-by-ayah reading room (Istiak's design):
 * one big calm card — Arabic ayah + English meaning — prev/next at the bottom,
 * surah/juz/today-count chips around it, a top-right play button that recites
 * ONLY this ayah (words highlight as it plays; hover highlights without audio),
 * fullscreen for distraction-free reading. Keyboard: ← → navigate · F
 * fullscreen · Esc exit.
 *
 * Modes:
 *  - free    browse a full surah; finishing auto-advances to the NEXT surah.
 *  - khatam  serial journey; advances the khatam bookmark + wraps a khatm.
 *  - single  a "beloved surah"; finishing REDIRECTS to /quran (no next surah).
 *  - bundle  a bounded āyah selection or duʿā; does NOT count toward the goal
 *            (Istiak's spec) and redirects to /quran when finished.
 *
 * Reading counts toward the daily āyah goal in free/khatam/single only.
 * Finishing a surah (reaching its last āyah) credits ONE completion toward
 * the "top surahs" list.
 */

const FONT_SIZES = ['text-2xl sm:text-3xl', 'text-3xl sm:text-4xl', 'text-4xl sm:text-5xl'];
const TR_FONT_SIZES = ['text-xs sm:text-sm', 'text-sm sm:text-base', 'text-base sm:text-lg'];

// ── Resume tracking: where the reader left off, per surah ──────────────────────
const RESUME_KEY = 'ihsan_reader_pos';
function readResumeMap(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(RESUME_KEY) ?? '{}') as Record<string, number>; }
  catch { return {}; }
}
function getResume(surah: number): number { return readResumeMap()[String(surah)] ?? 0; }
function saveResume(surah: number, ayah: number): void {
  const m = readResumeMap();
  m[String(surah)] = ayah;
  localStorage.setItem(RESUME_KEY, JSON.stringify(m));
}
function clearResume(surah: number): void {
  const m = readResumeMap();
  delete m[String(surah)];
  localStorage.setItem(RESUME_KEY, JSON.stringify(m));
}

type ReaderMode = 'free' | 'khatam' | 'bundle' | 'single';

export default function QuranReader() {
  const { surah: surahParam } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const surahNo = Math.min(114, Math.max(1, Number(surahParam) || 1));
  const mode = (params.get('mode') ?? 'free') as ReaderMode;
  const hasStart = params.get('start') != null;
  const startAyah = Number(params.get('start')) || 1;
  const endAyah = Number(params.get('end')) || null; // bundle bound

  const { data: summary } = useQuranSummary();
  const readAyat = useReadAyat();
  const toggleBookmark = useToggleBookmark();
  const reflect = useAiReflect();
  const [reflectOpen, setReflectOpen] = useState(false);

  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [ayat, setAyat] = useState<AyahText[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0); // index within `ayat`
  const [fullscreen, setFullscreen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [wordIdx, setWordIdx] = useState(-1);
  const [resumeAyah, setResumeAyah] = useState<number | null>(null); // continue-or-restart prompt
  const [volume, setVolume] = useState<number>(() => {
    const raw = localStorage.getItem('ihsan_quran_volume');
    const v = Number(raw);
    return raw !== null && Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.4; // 40% default
  });
  const fontSize = FONT_SIZES[Number(localStorage.getItem('ihsan_quran_font')) || 1] ?? FONT_SIZES[1]!;
  const trFontSize = TR_FONT_SIZES[Number(localStorage.getItem('ihsan_quran_font_tr')) || 1] ?? TR_FONT_SIZES[1]!;
  const editions = useMemo(() => selectedTranslations(), []);
  const editionLabel = (id: string) => TRANSLATIONS.find((t) => t.id === id)?.label ?? id;

  // free/single reads track a resume position; khatam uses the server bookmark,
  // bundles are bounded — neither uses local resume.
  const usesResume = mode === 'free' || mode === 'single';
  const countsGoal = mode !== 'bundle';

  const cardRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ayat advanced past but not yet flushed to the server
  const pendingRef = useRef(0);
  const seenRef = useRef(new Set<number>());
  const suppressSaveRef = useRef(false);

  const surahMeta = useMemo(() => surahs.find((s) => s.number === surahNo) ?? null, [surahs, surahNo]);
  const current = ayat[idx] ?? null;
  const lastIdx = endAyah ? Math.min(ayat.length - 1, endAyah - 1) : ayat.length - 1;
  const firstIdx = mode === 'bundle' ? startAyah - 1 : 0;

  // ── data ──
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setResumeAyah(null);
    suppressSaveRef.current = false;
    seenRef.current = new Set();
    Promise.all([loadSurahList(), loadSurahText(surahNo)])
      .then(([list, text]) => {
        if (!alive) return;
        setSurahs(list);
        setAyat(text);
        const initialIdx = Math.min(text.length - 1, Math.max(0, startAyah - 1));
        setIdx(initialIdx);
        setLoading(false);
        // Offer "continue where you left off?" for an unfinished free/single read.
        if (usesResume && !hasStart) {
          const saved = getResume(surahNo);
          if (saved > 1 && saved <= text.length) setResumeAyah(saved);
        }
      })
      .catch(() => { if (alive) { setLoading(false); toast.error('Could not load the surah — check your connection.', { id: 'quran-load' }); } });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNo]);

  // ── logging: count each NEW ayah the reader moves past, flush in batches ──
  const flush = useCallback((completedSurah = false) => {
    const n = pendingRef.current;
    if ((n <= 0 && !completedSurah) || !user || !countsGoal) return;
    pendingRef.current = 0;
    readAyat.mutate(
      { count: n, surah: surahNo, advanceKhatm: mode === 'khatam', completedSurah },
      { onSuccess: (r) => { if (r.khatmCompleted) celebrateKhatm(); } }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, surahNo, mode, countsGoal]);

  useEffect(() => () => flush(), [flush]); // flush on unmount / surah change

  const markRead = useCallback((ayahIdx: number) => {
    if (!countsGoal) return; // bundles/duas don't count toward the goal
    const a = ayat[ayahIdx];
    if (!a || seenRef.current.has(a.number)) return;
    seenRef.current.add(a.number);
    pendingRef.current += 1;
    const before = (summary?.todayAyat ?? 0) + pendingRef.current - 1;
    const goal = summary?.profile.dailyGoalAyat ?? 1;
    if (before < goal && before + 1 >= goal) celebrateGoal();
    if (pendingRef.current >= 5) flush();
  }, [ayat, flush, summary, countsGoal]);

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
    a.volume = volume;
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
  }, [current, playing, stopAudio, volume]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    localStorage.setItem('ihsan_quran_volume', String(v));
  }, []);

  // ── navigation ──
  const goToIdx = useCallback((next: number) => {
    stopAudio();
    setIdx(next);
    if (usesResume && !suppressSaveRef.current) { const a = ayat[next]; if (a) saveResume(surahNo, a.numberInSurah); }
  }, [stopAudio, usesResume, ayat, surahNo]);

  const finishAndRedirect = useCallback((msg: string) => {
    suppressSaveRef.current = true;
    clearResume(surahNo);
    celebrateSmall();
    toast.success(msg, { id: 'reader-done', duration: 2200 });
    setTimeout(() => navigate('/quran'), 850);
  }, [surahNo, navigate]);

  const goNext = useCallback(() => {
    stopAudio();
    if (idx < lastIdx) {
      markRead(idx); // moving past the current ayah = it was read
      goToIdx(idx + 1);
      return;
    }
    // At the last ayah of this view.
    if (mode === 'bundle') {
      finishAndRedirect('Complete — may it protect and bless you 🤲');
      return;
    }
    // free / khatam / single reached the surah's end
    markRead(idx);
    flush(true); // credits the surah completion
    clearResume(surahNo);
    if (mode === 'single') {
      finishAndRedirect(`${surahMeta?.englishName ?? 'Surah'} complete 🌿`);
      return;
    }
    if (surahNo < 114) {
      suppressSaveRef.current = true;
      celebrateSmall();
      toast.success(`${surahMeta?.englishName ?? 'Surah'} completed — onward! 🌿`, { id: 'surah-done', duration: 2200 });
      // REPLACE so Back returns to where you came from — not the finished surah
      // — and so you can't step back into the previous surah.
      navigate(`/quran/read/${surahNo + 1}?mode=${mode}`, { replace: true });
    } else {
      finishAndRedirect('Khatm complete — Allahu akbar! 🕋');
      celebrateKhatm();
    }
  }, [idx, lastIdx, markRead, stopAudio, flush, mode, surahNo, surahMeta, navigate, goToIdx, finishAndRedirect]);

  const goPrev = useCallback(() => {
    if (idx > firstIdx) goToIdx(idx - 1);
  }, [idx, firstIdx, goToIdx]);

  // ── AI reflection (encouragement only) ──
  const onReflect = useCallback(() => {
    if (!current) return;
    setReflectOpen(true);
    reflect.mutate({ surah: surahNo, ayah: current.numberInSurah, text: current.translations[0] || current.arabic });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, surahNo]);

  // Close the reflection when the ayah changes — a reflection belongs to one āyah.
  useEffect(() => { setReflectOpen(false); }, [current?.number]);

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
          <button
            className="text-white/40 hover:text-white"
            onClick={() => {
              // Go back to wherever the reader was opened from; fall back to
              // the section home when the reader was the entry point.
              if (window.history.length > 1) navigate(-1);
              else navigate(mode === 'khatam' ? '/quran/khatam' : '/quran');
            }}
          >← Back</button>
          <div className="flex items-center gap-2 text-white/40">
            {mode === 'khatam' && <span className="px-2 py-0.5 rounded-full bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30 font-bold">Khatam journey</span>}
            {(mode === 'bundle' || mode === 'single') && <span className="px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 font-bold">Special selection</span>}
            <span className="hidden sm:inline">⌨️ ← → · F fullscreen</span>
          </div>
        </div>

        {/* info chips */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-slate-400/10 text-white/70 font-bold">
            {surahNo}. {surahMeta?.englishName ?? '…'} <span className="text-white/30">· {surahMeta?.numberOfAyahs ?? '–'} āyāt</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-slate-400/10 text-white/50">
            Juz {current ? juzOf(surahNo, current.numberInSurah) : '–'}
          </span>
          {countsGoal ? (
            <span className="px-2.5 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/25 text-brand-emerald font-bold">
              📖 {todayCount} āyāt today{summary ? ` / ${summary.profile.dailyGoalAyat} goal` : ''}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-slate-400/10 text-white/40">
              🤲 Reflection — not counted toward the goal
            </span>
          )}
          {khatamPos && (
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-slate-400/10 text-white/40">
              Khatam at {khatamPos.surah}:{khatamPos.ayah}
            </span>
          )}
        </div>

        {/* ── THE CARD ── */}
        <div
          ref={cardRef}
          className={`relative rounded-3xl border border-slate-400/10 bg-gradient-to-br from-[#0d1b17] via-[#0a1412] to-[#0d1420] overflow-hidden ${fullscreen ? 'fixed inset-0 z-50 rounded-none grid place-items-center p-6 sm:p-16' : 'p-6 sm:p-10'}`}
        >
          {/* top-right controls */}
          <div className={`absolute top-4 right-4 flex items-center gap-2 z-10`}>
            <button
              aria-label={playing ? 'Stop recitation' : 'Recite this ayah'}
              title="Recite only this ayah"
              onClick={playAyah}
              className={`w-10 h-10 rounded-full grid place-items-center border transition-all ${playing ? 'bg-brand-emerald text-white border-brand-emerald' : 'bg-white/5 text-brand-emerald border-slate-400/10 hover:border-brand-emerald/50'}`}
            >
              {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 ml-0.5" />}
            </button>
            {user && (
              <button
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this ayah'}
                onClick={() => current && toggleBookmark.mutate({ surah: surahNo, ayah: current.numberInSurah })}
                className="w-10 h-10 rounded-full grid place-items-center border bg-white/5 border-slate-400/10 text-brand-gold hover:border-brand-gold/50"
              >
                {isBookmarked ? <BookmarkSolid className="w-4 h-4" /> : <BookmarkOutline className="w-4 h-4" />}
              </button>
            )}
            <button
              aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-full grid place-items-center border bg-white/5 border-slate-400/10 text-white/50 hover:text-white"
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

                <div className="space-y-3 max-w-2xl mx-auto">
                  {current.translations.map((tr, i) => (
                    <p key={editions[i] ?? i} className={`${i === 0 ? 'text-white/60' : 'text-teal-100/50'} ${trFontSize} leading-relaxed`}>
                      {tr}
                    </p>
                  ))}
                </div>
                <p className="text-white/20 text-[10px]">
                  {editions.map(editionLabel).join(' · ')} ·{' '}
                  <a className="underline" href={`https://quran.com/${surahNo}/${current.numberInSurah}`} target="_blank" rel="noreferrer">quran.com/{surahNo}/{current.numberInSurah}</a>
                </p>
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
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 border border-slate-400/10 text-white/60 hover:text-white disabled:opacity-20 text-sm font-bold"
              >
                <ChevronLeftIcon className="w-4 h-4" /> Previous
              </button>
              <button
                aria-label="Next ayah"
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-brand-emerald/90 hover:bg-brand-emerald text-white text-sm font-black border-0"
              >
                {idx >= lastIdx
                  ? (mode === 'bundle' ? 'Finish 🤲' : mode === 'single' ? 'Finish 🌿' : surahNo < 114 ? 'Next surah' : 'Finish')
                  : 'Next'}
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* bottom controls: jump (left) · volume (right) */}
        {!loading && ayat.length > 0 && (
          <div className="flex items-center justify-between gap-3 text-xs text-white/40">
            {mode !== 'bundle' ? (
              <div className="flex items-center gap-2">
                <label htmlFor="jump-ayah" className="font-bold">Jump to āyah</label>
                <select
                  id="jump-ayah"
                  className="select select-xs bg-white/5 border-slate-400/10 text-white/70 rounded-lg"
                  value={idx + 1}
                  onChange={(e) => goToIdx(Number(e.target.value) - 1)}
                >
                  {ayat.map((a) => <option key={a.number} value={a.numberInSurah}>{a.numberInSurah}</option>)}
                </select>
              </div>
            ) : <span />}

            {/* volume control (defaults to 40%) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                aria-label={volume === 0 ? 'Volume off' : 'Volume'}
                className="text-white/50 hover:text-white"
                onClick={() => changeVolume(volume === 0 ? 0.4 : 0)}
              >
                {volume === 0 ? <SpeakerXMarkIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}
              </button>
              <input
                type="range" min={0} max={100} value={Math.round(volume * 100)}
                aria-label="Recitation volume"
                onChange={(e) => changeVolume(Number(e.target.value) / 100)}
                className="range range-xs w-24 [--range-shdw:theme(colors.emerald.400)]"
              />
            </div>
          </div>
        )}

        {/* ── ✨ Reflect with Rafiq (AI — encouragement only) ── */}
        {!loading && current && user && (
          <div>
            {!reflectOpen ? (
              <button
                onClick={onReflect}
                className="group relative w-full rounded-2xl p-[1.5px] overflow-hidden"
              >
                <motion.span
                  aria-hidden className="absolute inset-0"
                  style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4,#a855f7,#ec4899,#f59e0b,#10b981)', backgroundSize: '300% 100%', opacity: 0.55 }}
                  animate={{ backgroundPosition: ['0% 50%', '300% 50%'] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                />
                <span className="relative flex items-center justify-center gap-2 rounded-[calc(1rem-1.5px)] bg-brand-deep/95 px-4 py-2.5 text-sm font-bold text-white/80 group-hover:text-white">
                  <SparklesIcon className="w-4 h-4 text-fuchsia-300" />
                  Reflect on this āyah with Rafiq
                </span>
              </button>
            ) : (
              <AiPanel>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <AiBadge />
                    <button className="text-white/40 hover:text-white text-xs" onClick={() => setReflectOpen(false)}>Close</button>
                  </div>
                  {reflect.isPending ? (
                    <AiThinking />
                  ) : reflect.isError ? (
                    <div className="py-3 text-center">
                      <p className="text-white/50 text-sm">Rafiq is resting right now — please try again in a moment.</p>
                      <button className="mt-2 btn btn-xs bg-white/10 border-slate-400/15 text-white/70" onClick={onReflect}>Retry</button>
                    </div>
                  ) : (
                    <>
                      <p className="text-white/80 text-sm leading-relaxed">{reflect.data?.reflection}</p>
                      <div className="flex items-center justify-between mt-2">
                        <button className="text-fuchsia-300/70 hover:text-fuchsia-200 text-xs font-bold" onClick={onReflect}>↻ Another reflection</button>
                        {reflect.data?.provider && <span className="text-white/20 text-[9px]">via {reflect.data.provider}</span>}
                      </div>
                    </>
                  )}
                  <AiDisclaimer />
                </div>
              </AiPanel>
            )}
          </div>
        )}
      </div>

      {/* ── Continue where you left off? ── */}
      <AnimatePresence>
        {resumeAyah !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm grid place-items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 8 }}
              transition={{ type: 'spring', damping: 24 }}
              className="w-full max-w-xs rounded-2xl bg-brand-deep border border-brand-emerald/25 p-5 text-center"
              role="alertdialog" aria-modal="true"
            >
              <div className="text-3xl mb-2">📖</div>
              <h3 className="text-white font-black text-base">Continue reading?</h3>
              <p className="text-white/50 text-xs mt-1.5 leading-relaxed">
                You left {surahMeta?.englishName ?? 'this surah'} at āyah <b className="text-brand-emerald">{resumeAyah}</b>.
                Pick up from there, or start over from the beginning.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 btn btn-sm rounded-xl bg-white/5 border-slate-400/10 text-white/70"
                  onClick={() => { clearResume(surahNo); setIdx(0); setResumeAyah(null); }}
                >
                  Start over
                </button>
                <button
                  className="flex-1 btn btn-sm rounded-xl border-0 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500"
                  onClick={() => { setIdx(Math.min(ayat.length - 1, resumeAyah - 1)); setResumeAyah(null); }}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
