import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon,
  BookmarkIcon as BookmarkOutline, SpeakerWaveIcon, SpeakerXMarkIcon, BookOpenIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '../store/useAuthStore.js';
import { useQuranSummary, useReadAyat, useToggleBookmark, useSetResume } from '../hooks/useQuran.js';
import { useTafsir } from '../hooks/useQuran.js';
import { TAFSIRS, getPreferredTafsir, setPreferredTafsir } from '../utils/tafsir.js';
import { QURANIC_DUAS } from '../utils/quranMeta.js';
import { getArabicFont, getFontPx, translitEnabled } from '../utils/quranPrefs.js';
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

// Typography now comes from quranPrefs: user-chosen Arabic font (easy-to-read
// default) + free-range px sliders for every text kind (Istiak's spec).

// ── Resume tracking: where the reader left off, per surah ─────────────────────
// localStorage is the fast cache; the SERVER copy (QuranProfile.readerPos) is
// the source of truth so the same account resumes at the same āyah on every
// device (Istiak: web said āyah 12, phone said 3 — critical bug).
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
  // When opened from "Duas from the Quran": carries the story/evidence panel
  const dua = useMemo(() => {
    const id = params.get('dua');
    return id ? QURANIC_DUAS.find((d) => d.id === id) ?? null : null;
  }, [params]);
  const [contextOpen, setContextOpen] = useState(false);
  const hasStart = params.get('start') != null;
  const startAyah = Number(params.get('start')) || 1;
  const endAyah = Number(params.get('end')) || null; // bundle bound

  const { data: summary } = useQuranSummary();
  const readAyat = useReadAyat();
  const toggleBookmark = useToggleBookmark();
  const setResumeServer = useSetResume();
  const resumeSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumePromptDoneRef = useRef(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsirEdition, setTafsirEdition] = useState<number>(getPreferredTafsir);
  const [splitTafsir, setSplitTafsir] = useState(false); // fullscreen 2-pane reading
  // Draggable split (Istiak: a short āyah can pair with a LONG tafsir — the
  // reader decides how much room each side gets). Left-pane %, persisted.
  const [splitPct, setSplitPct] = useState<number>(() => {
    const v = Number(localStorage.getItem('ihsan_split_pct'));
    return Number.isFinite(v) && v >= 25 && v <= 75 ? v : 50;
  });
  const draggingRef = useRef(false);

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
  // Typography prefs — read once per mount (the settings drawer writes them)
  const arabicFont = useMemo(() => getArabicFont(), []);
  const fs = useMemo(() => ({
    arabic: getFontPx('arabic'),
    translation: getFontPx('translation'),
    translit: getFontPx('translit'),
    tafsir: getFontPx('tafsir'),
  }), []);
  const showTranslit = useMemo(() => translitEnabled(), []);
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
    resumePromptDoneRef.current = false;
    suppressSaveRef.current = false;
    seenRef.current = new Set();
    Promise.all([loadSurahList(), loadSurahText(surahNo, undefined, showTranslit)])
      .then(([list, text]) => {
        if (!alive) return;
        setSurahs(list);
        setAyat(text);
        const initialIdx = Math.min(text.length - 1, Math.max(0, startAyah - 1));
        setIdx(initialIdx);
        setLoading(false);
      })
      .catch(() => { if (alive) { setLoading(false); toast.error('Could not load the surah — check your connection.', { id: 'quran-load' }); } });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNo]);

  // Offer "continue where you left off?" once text (and, when signed in, the
  // server summary) is available. Server position wins over the local cache.
  useEffect(() => {
    if (loading || !usesResume || hasStart || resumePromptDoneRef.current) return;
    if (user && !summary) return; // wait for the authoritative copy
    resumePromptDoneRef.current = true;
    const serverPos = Number(summary?.profile.readerPos?.[String(surahNo)] ?? 0);
    const saved = serverPos > 0 ? serverPos : getResume(surahNo);
    if (saved > 1 && saved <= ayat.length) {
      saveResume(surahNo, saved); // refresh the local cache from the server
      setResumeAyah(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, summary, surahNo, usesResume, hasStart, user]);

  // Push the resume position to the server, debounced — cheap and idempotent.
  const syncResume = useCallback((ayah: number) => {
    if (!user) return;
    if (resumeSyncTimerRef.current) clearTimeout(resumeSyncTimerRef.current);
    resumeSyncTimerRef.current = setTimeout(() => {
      setResumeServer.mutate({ surah: surahNo, ayah });
    }, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, surahNo]);

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
    if (usesResume && !suppressSaveRef.current) {
      const a = ayat[next];
      if (a) { saveResume(surahNo, a.numberInSurah); syncResume(a.numberInSurah); }
    }
  }, [stopAudio, usesResume, ayat, surahNo, syncResume]);

  const finishAndRedirect = useCallback((msg: string) => {
    suppressSaveRef.current = true;
    clearResume(surahNo);
    syncResume(0); // clear on the server too
    celebrateSmall();
    toast.success(msg, { id: 'reader-done', duration: 2200 });
    // Finishing a duʿā returns to the DUA SECTION of the Quran home, not the
    // top of the page (Istiak: landing mid-page felt wrong).
    setTimeout(() => navigate(dua ? '/quran#duas' : '/quran'), 850);
  }, [surahNo, navigate, syncResume, dua]);

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
    syncResume(0);
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
  }, [idx, lastIdx, markRead, stopAudio, flush, mode, surahNo, surahMeta, navigate, goToIdx, finishAndRedirect, syncResume]);

  const goPrev = useCallback(() => {
    if (idx > firstIdx) goToIdx(idx - 1);
  }, [idx, firstIdx, goToIdx]);

  // ── Tafsir (authentic, from quran.com — NO AI anywhere in the Quran rooms) ──
  const ayahNo = current?.numberInSurah ?? 0;
  const tafsir = useTafsir(surahNo, ayahNo, tafsirEdition, (tafsirOpen || splitTafsir) && ayahNo > 0);
  const tafsirIsBn = TAFSIRS.find((t) => t.id === tafsirEdition)?.language === 'bn';
  // Calm long-form reading: warm ink (never pure white), generous line-height,
  // and a Bengali-friendly font stack when a বাংলা edition is selected.
  const tafsirTextStyle = {
    color: '#d6d0bf',
    fontSize: fs.tafsir,
    lineHeight: tafsirIsBn ? 2.15 : 1.95,
    ...(tafsirIsBn ? { fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', 'Bangla Sangam MN', 'Vrinda', sans-serif" } : {}),
  } as const;
  const changeTafsirEdition = (id: number) => {
    setTafsirEdition(id);
    setPreferredTafsir(id);
  };

  // ── fullscreen + keyboard ──
  // Native requestFullscreen where available; iOS Safari has none, so the
  // `fullscreen` state ALWAYS drives a CSS fixed-inset fallback (the old
  // `.then()` on an undefined return value silently broke mobile).
  const toggleFullscreen = useCallback(() => {
    const el = cardRef.current;
    if (fullscreen) {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
      return;
    }
    try {
      const p = el?.requestFullscreen?.();
      if (p) p.catch(() => {});
    } catch { /* no native fullscreen — CSS fallback still applies */ }
    setFullscreen(true);
  }, [fullscreen]);

  useEffect(() => {
    const onFsChange = () => {
      // Only native EXITS matter here (Esc / swipe) — entry is handled above.
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Split is a fullscreen-only mode; lock page scroll + drop the navbar under
  // the CSS-fallback overlay while fullscreen.
  useEffect(() => {
    if (!fullscreen) setSplitTafsir(false);
    const navbar = document.querySelector<HTMLElement>('nav');
    if (fullscreen) {
      if (navbar) navbar.style.zIndex = '0';
      document.body.style.overflow = 'hidden';
    } else {
      if (navbar) navbar.style.zIndex = '';
      document.body.style.overflow = '';
    }
    return () => {
      if (navbar) navbar.style.zIndex = '';
      document.body.style.overflow = '';
    };
  }, [fullscreen]);

  // Drag-to-resize the fullscreen split (desktop pointer or touch).
  const onDragStart = useCallback((e: ReactPointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    const onMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      const pct = Math.min(75, Math.max(25, (ev.clientX / window.innerWidth) * 100));
      setSplitPct(pct);
    };
    const onUp = () => {
      draggingRef.current = false;
      setSplitPct((v) => { localStorage.setItem('ihsan_split_pct', String(Math.round(v))); return v; });
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
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
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-emerald-500/10 text-white/70 font-bold">
            {surahNo}. {surahMeta?.englishName ?? '…'} <span className="text-white/30">· {surahMeta?.numberOfAyahs ?? '–'} āyāt</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-emerald-500/10 text-white/50">
            Juz {current ? juzOf(surahNo, current.numberInSurah) : '–'}
          </span>
          {countsGoal ? (
            <span className="px-2.5 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/25 text-brand-emerald font-bold">
              📖 {todayCount} āyāt today{summary ? ` / ${summary.profile.dailyGoalAyat} goal` : ''}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-emerald-500/10 text-white/40">
              🤲 Reflection — not counted toward the goal
            </span>
          )}
          {khatamPos && (
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-emerald-500/10 text-white/40">
              Khatam at {khatamPos.surah}:{khatamPos.ayah}
            </span>
          )}
        </div>

        {/* ── THE CARD ──
            Fullscreen uses the `fullscreen` STATE (CSS fixed-inset) so it works
            on iOS too; native Fullscreen API is a progressive bonus. On mobile
            the split becomes a vertical stack — āyah first, tafsir below. */}
        <div
          ref={cardRef}
          className={`relative rounded-3xl border border-emerald-500/10 bg-gradient-to-br from-[#0d1b17] via-[#0a1412] to-[#0d1420] ${fullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col md:flex-row overflow-y-auto overflow-x-hidden md:overflow-hidden' : 'overflow-hidden p-4 sm:p-10'}`}
        >
          {/* controls — in-flow row on phones (they overlapped the āyah header),
              floating top-right from sm up */}
          <div className={`flex items-center justify-end gap-2 z-20 ${fullscreen ? 'absolute top-3 right-3 sm:top-4 sm:right-4' : 'sm:absolute sm:top-4 sm:right-4 mb-2 sm:mb-0'}`}>
            <button
              aria-label={playing ? 'Stop recitation' : 'Recite this ayah'}
              title="Recite only this ayah"
              onClick={playAyah}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center border transition-all ${playing ? 'bg-brand-emerald text-white border-brand-emerald' : 'bg-white/5 text-brand-emerald border-emerald-500/10 hover:border-brand-emerald/50'}`}
            >
              {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 ml-0.5" />}
            </button>
            {user && (
              <button
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this ayah'}
                onClick={() => current && toggleBookmark.mutate({ surah: surahNo, ayah: current.numberInSurah })}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center border bg-white/5 border-emerald-500/10 text-brand-gold hover:border-brand-gold/50"
              >
                {isBookmarked ? <BookmarkSolid className="w-4 h-4" /> : <BookmarkOutline className="w-4 h-4" />}
              </button>
            )}
            {/* fullscreen-only: open the tafsir (split on desktop, stacked below on mobile) */}
            {fullscreen && (
              <button
                aria-label={splitTafsir ? 'Hide tafsir' : 'Read tafsir'}
                title="Tafsir"
                onClick={() => setSplitTafsir((v) => !v)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center border transition-all ${splitTafsir ? 'bg-brand-emerald/20 text-brand-emerald border-brand-emerald/50' : 'bg-white/5 text-white/60 border-emerald-500/10 hover:text-white'}`}
              >
                <BookOpenIcon className="w-4 h-4" />
              </button>
            )}
            <button
              aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              onClick={toggleFullscreen}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center border bg-white/5 border-emerald-500/10 text-white/50 hover:text-white"
            >
              {fullscreen ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
            </button>
          </div>

          {/* LEFT pane (the āyah + meaning). Fullscreen desktop: resizable width; mobile: full-width block. */}
          <div
            className={fullscreen
              ? `relative md:h-full grid place-items-center md:overflow-y-auto p-6 pt-16 sm:p-12 w-full shrink-0 md:shrink ${splitTafsir ? 'md:border-r md:border-emerald-500/15 min-h-[70vh] md:min-h-0 md:w-[var(--split)]' : ''}`
              : 'contents'}
            style={fullscreen && splitTafsir ? ({ '--split': `${splitPct}%` } as CSSProperties) : undefined}
          >
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
                className={`${fullscreen ? 'max-w-4xl' : ''} w-full text-center space-y-6 sm:space-y-8 pt-2 sm:pt-8`}
              >
                <div className="space-y-0.5">
                  <p className="text-white/25 text-xs font-bold tracking-widest">
                    {surahMeta?.name} · {current.numberInSurah}/{surahMeta?.numberOfAyahs}
                  </p>
                  {surahMeta?.englishNameTranslation && (
                    <p className="text-white/30 text-[11px]">
                      {surahMeta.englishName} — “{surahMeta.englishNameTranslation}”
                    </p>
                  )}
                </div>

                {/* Arabic — word hover highlight; timed highlight while reciting */}
                <p dir="rtl" lang="ar" className="leading-[2.1] text-[#e8e2d0]"
                  style={{ fontSize: fs.arabic, fontFamily: arabicFont.stack }}>
                  {words.map((w, i) => (
                    <span
                      key={i}
                      className={`transition-colors duration-150 rounded px-0.5 cursor-default ${playing && i === wordIdx ? 'bg-brand-emerald/35 text-white' : 'hover:bg-white/10'}`}
                    >
                      {w}{' '}
                    </span>
                  ))}
                </p>

                {/* Transliteration — Latin pronunciation aid (optional) */}
                {showTranslit && current.transliteration && (
                  <p className="text-brand-gold/60 italic leading-relaxed max-w-2xl mx-auto"
                    style={{ fontSize: fs.translit }}>
                    {current.transliteration}
                  </p>
                )}

                <div className="space-y-3 max-w-2xl mx-auto">
                  {current.translations.map((tr, i) => (
                    <p key={editions[i] ?? i} className={`${i === 0 ? 'text-white/60' : 'text-teal-100/50'} leading-relaxed`}
                      style={{ fontSize: fs.translation }}>
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

          {/* prev / next — absolute at the bottom only on desktop fullscreen;
              in the mobile stack they stay in flow under the āyah */}
          {!loading && current && (
            <div className={`flex items-center justify-between ${fullscreen ? 'mt-8 w-full max-w-4xl md:mt-0 md:max-w-none md:absolute md:bottom-8 md:left-8 md:right-8' : 'mt-8'}`}>
              <button
                aria-label="Previous ayah"
                onClick={goPrev}
                disabled={idx <= firstIdx}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 border border-emerald-500/10 text-white/60 hover:text-white disabled:opacity-20 text-sm font-bold"
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
          </div>{/* end left pane */}

          {/* drag handle — desktop fullscreen split only */}
          {fullscreen && splitTafsir && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize the tafsir pane"
              onPointerDown={onDragStart}
              className="hidden md:flex items-center justify-center w-3 -mx-1.5 h-full cursor-col-resize z-30 group shrink-0"
            >
              <div className="w-1 h-16 rounded-full bg-white/15 group-hover:bg-brand-emerald/60 transition-colors" />
            </div>
          )}

          {/* TAFSIR pane — beside the āyah on desktop, stacked below on mobile.
              Calm long-form reading: warm surface, warm ink, roomy line-height. */}
          {fullscreen && splitTafsir && (
            <div className="w-full md:flex-1 md:h-full md:overflow-y-auto bg-[#12100c] px-5 sm:px-8 pb-10 pt-4 md:pt-6 border-t border-amber-100/5 md:border-t-0">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-3 md:sticky md:top-0 bg-[#12100c]/95 backdrop-blur md:-mt-2 md:pt-2 pb-2 z-10">
                  <BookOpenIcon className="w-4 h-4 text-amber-200/60 shrink-0" />
                  <select
                    aria-label="Tafsir edition"
                    className="select select-xs flex-1 max-w-xs bg-white/5 border-amber-100/10 text-white/80 rounded-lg"
                    value={tafsirEdition}
                    onChange={(e) => changeTafsirEdition(Number(e.target.value))}
                  >
                    <optgroup label="English">
                      {TAFSIRS.filter((t) => t.language === 'en').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>
                    <optgroup label="বাংলা (Bengali)">
                      {TAFSIRS.filter((t) => t.language === 'bn').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>
                  </select>
                </div>
                {tafsir.isLoading ? (
                  <div className="py-10 grid place-items-center"><span className="loading loading-spinner text-brand-emerald" /></div>
                ) : tafsir.isError ? (
                  <p className="text-white/50 text-sm">Couldn't load this tafsir — try another edition.</p>
                ) : (
                  <>
                    <p className="text-amber-200/50 text-xs font-bold mb-3">{surahNo}:{ayahNo} · {tafsir.data?.resourceName}</p>
                    <div className={`whitespace-pre-line`} style={tafsirTextStyle}>{tafsir.data?.text}</div>
                    <p className="text-white/25 text-[10px] mt-4">
                      Sourced from <a className="underline" href={tafsir.data?.url} target="_blank" rel="noreferrer">quran.com</a> — authentic, unedited.
                    </p>
                  </>
                )}
              </div>
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
                  className="select select-xs bg-white/5 border-emerald-500/10 text-white/70 rounded-lg"
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

        {/* ── Tafsir (authentic, sourced — the Quran rooms carry NO AI) ── */}
        {!loading && current && user && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setTafsirOpen((o) => !o)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold border transition-all ${tafsirOpen ? 'bg-brand-emerald/15 border-brand-emerald/30 text-brand-emerald' : 'bg-white/5 border-emerald-500/12 text-white/70 hover:text-white'}`}
              >
                <BookOpenIcon className="w-4 h-4" /> Tafsir
              </button>
              {dua?.context && (
                <button
                  onClick={() => setContextOpen((o) => !o)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold border transition-all ${contextOpen ? 'bg-brand-gold/15 border-brand-gold/35 text-brand-gold' : 'bg-white/5 border-emerald-500/12 text-white/70 hover:text-white'}`}
                >
                  📜 Why this duʿā
                </button>
              )}
            </div>

            {/* The story & evidence behind this duʿā (verified reference) */}
            {contextOpen && dua?.context && (
              <div className="rounded-2xl border border-brand-gold/15 bg-[#141108] p-4 sm:p-5 space-y-2.5">
                <p className="text-brand-gold/80 text-xs font-black">{dua.emoji} {dua.title}</p>
                <p className="text-[#d8d0b8] text-sm leading-relaxed">{dua.context.text}</p>
                <a
                  className="inline-block text-brand-gold/60 text-[11px] underline hover:text-brand-gold"
                  href={dua.context.ref.url} target="_blank" rel="noreferrer"
                >{dua.context.ref.text} ↗</a>
              </div>
            )}

            {/* Calm reading surface: warm dark ground + warm ink, never pure white */}
            {tafsirOpen && (
              <div className="rounded-2xl border border-amber-100/8 bg-[#12100c] p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Tafsir edition"
                    className="select select-xs flex-1 bg-white/5 border-amber-100/10 text-white/80 rounded-lg"
                    value={tafsirEdition}
                    onChange={(e) => changeTafsirEdition(Number(e.target.value))}
                  >
                    <optgroup label="English">
                      {TAFSIRS.filter((t) => t.language === 'en').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>
                    <optgroup label="বাংলা (Bengali)">
                      {TAFSIRS.filter((t) => t.language === 'bn').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>
                  </select>
                  <button className="text-white/40 hover:text-white text-xs shrink-0" onClick={() => setTafsirOpen(false)}>Close</button>
                </div>

                {tafsir.isLoading ? (
                  <div className="py-6 grid place-items-center"><span className="loading loading-spinner text-brand-emerald" /></div>
                ) : tafsir.isError ? (
                  <p className="text-white/50 text-sm py-2">Couldn't load this tafsir — check your connection or try another edition.</p>
                ) : (
                  <>
                    <div className={`max-h-96 overflow-y-auto pr-2 whitespace-pre-line`} style={tafsirTextStyle}>
                      {tafsir.data?.text}
                    </div>
                    <p className="text-white/30 text-[10px]">
                      📖 {tafsir.data?.resourceName} · sourced from{' '}
                      <a className="underline" href={tafsir.data?.url} target="_blank" rel="noreferrer">quran.com</a> — authentic, unedited.
                    </p>
                  </>
                )}
              </div>
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
                  className="flex-1 btn btn-sm rounded-xl bg-white/5 border-emerald-500/10 text-white/70"
                  onClick={() => { clearResume(surahNo); syncResume(0); setIdx(0); setResumeAyah(null); }}
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
