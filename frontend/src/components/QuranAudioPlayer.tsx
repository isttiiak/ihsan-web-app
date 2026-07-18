import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon, ForwardIcon, BackwardIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '../store/useAuthStore.js';
import { useLogReading } from '../hooks/useQuran.js';

/**
 * 🎧 Audio Quran — all 114 surahs, streamed from the free Islamic Network CDN
 * (the audio backend of alquran.cloud; no storage cost on our side).
 *
 * LISTENING AUTO-LOG: murattal recitation averages ~3 minutes per mushaf
 * page, so every 180 seconds of REAL listening time logs one page through
 * the normal /api/quran/read endpoint — it feeds the daily goal, streak,
 * khatm pace and Noor exactly like reading. This is also how Rayhanah
 * users keep their Quran connection alive (listening is agreed upon).
 */

const SECONDS_PER_PAGE = 180;

// Full-surah audio only exists for some editions on each CDN — every entry
// here was verified (HTTP 200) against its host. islamic.network takes the
// plain surah number; mp3quran.net wants it zero-padded to 3 digits.
const RECITERS: Array<{ id: string; name: string; url: (n: number) => string }> = [
  { id: 'alafasy', name: 'Mishary Alafasy',
    url: (n) => `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${n}.mp3` },
  { id: 'abdulbasit', name: 'Abdul Basit (Murattal)',
    url: (n) => `https://cdn.islamic.network/quran/audio-surah/128/ar.abdulbasitmurattal/${n}.mp3` },
  { id: 'husary', name: 'Mahmoud Al-Husary',
    url: (n) => `https://server13.mp3quran.net/husr/${String(n).padStart(3, '0')}.mp3` },
  { id: 'sudais', name: 'Abdur-Rahman As-Sudais',
    url: (n) => `https://server11.mp3quran.net/sds/${String(n).padStart(3, '0')}.mp3` },
  { id: 'maher', name: 'Maher Al-Muaiqly',
    url: (n) => `https://server12.mp3quran.net/maher/${String(n).padStart(3, '0')}.mp3` },
  { id: 'minshawi', name: 'Muhammad Al-Minshawi',
    url: (n) => `https://server10.mp3quran.net/minsh/${String(n).padStart(3, '0')}.mp3` },
];

interface SurahMeta {
  number: number;
  name: string;          // Arabic
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
}

const SURAH_CACHE_KEY = 'ihsan_surah_meta_v1';

async function loadSurahList(): Promise<SurahMeta[]> {
  try {
    const cached = localStorage.getItem(SURAH_CACHE_KEY);
    if (cached) return JSON.parse(cached) as SurahMeta[];
  } catch { /* refetch */ }
  const res = await fetch('https://api.alquran.cloud/v1/surah');
  const data = await res.json() as { data: SurahMeta[] };
  const list = data.data.map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    numberOfAyahs: s.numberOfAyahs,
  }));
  localStorage.setItem(SURAH_CACHE_KEY, JSON.stringify(list));
  return list;
}

function fmtClock(sec: number): string {
  if (!Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function QuranAudioPlayer() {
  const user = useAuthStore((s) => s.user);
  const logReading = useLogReading();

  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [surahNo, setSurahNo] = useState<number>(() => Number(localStorage.getItem('ihsan_last_surah')) || 1);
  const [reciter, setReciter] = useState<string>(() => {
    const stored = localStorage.getItem('ihsan_reciter') || 'alafasy';
    return RECITERS.some((r) => r.id === stored) ? stored : 'alafasy';
  });
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Listening accumulator — survives pause, resets only after a page is logged
  const listenedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const sessionPagesRef = useRef(0);

  useEffect(() => {
    let alive = true;
    loadSurahList()
      .then((list) => { if (alive) setSurahs(list); })
      .catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, []);

  const surah = useMemo(() => surahs.find((s) => s.number === surahNo) ?? null, [surahs, surahNo]);
  const src = (RECITERS.find((r) => r.id === reciter) ?? RECITERS[0]!).url(surahNo);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setProgress(a.currentTime);
    // Count only continuous listening (ignore seeks/jumps > 2s)
    const delta = a.currentTime - lastTimeRef.current;
    if (delta > 0 && delta <= 2) {
      listenedRef.current += delta;
      if (listenedRef.current >= SECONDS_PER_PAGE) {
        listenedRef.current -= SECONDS_PER_PAGE;
        sessionPagesRef.current += 1;
        if (user) {
          logReading.mutate({ pages: 1, advancePosition: false });
          toast.success('🎧 Listening logged: +1 page toward your goal', { id: 'quran-listen', duration: 2500 });
        }
      }
    }
    lastTimeRef.current = a.currentTime;
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { void a.play(); }
  };

  const changeSurah = (n: number) => {
    const clamped = Math.min(114, Math.max(1, n));
    setSurahNo(clamped);
    localStorage.setItem('ihsan_last_surah', String(clamped));
    setProgress(0);
    lastTimeRef.current = 0;
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const t = (Number(e.target.value) / 100) * duration;
    a.currentTime = t;
    lastTimeRef.current = t; // don't count the jump as listening
    setProgress(t);
  };

  return (
    <div className="card bg-gradient-to-br from-teal-500/10 to-brand-deep border border-teal-400/20 rounded-3xl">
      <div className="card-body p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-black">🎧 Listen to the Quran</h2>
          <select
            aria-label="Reciter"
            className="select select-xs bg-white/5 border-white/10 text-white/70 rounded-lg max-w-[45%]"
            value={reciter}
            onChange={(e) => { setReciter(e.target.value); localStorage.setItem('ihsan_reciter', e.target.value); }}
          >
            {RECITERS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        {loadError ? (
          <p className="text-white/40 text-xs">Couldn't load the surah list — check your connection and reload.</p>
        ) : (
          <>
            <select
              aria-label="Surah"
              className="select select-sm w-full bg-white/5 border-white/10 text-white rounded-xl"
              value={surahNo}
              onChange={(e) => changeSurah(Number(e.target.value))}
            >
              {(surahs.length ? surahs : [{ number: 1, name: '', englishName: 'Al-Fatihah', englishNameTranslation: 'The Opener', numberOfAyahs: 7 }]).map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.englishName} — {s.englishNameTranslation} ({s.numberOfAyahs} āyāt)
                </option>
              ))}
            </select>

            {surah && (
              <p className="text-center text-2xl text-teal-100/90 font-serif" dir="rtl">{surah.name}</p>
            )}

            {/* transport */}
            <div className="flex items-center justify-center gap-4">
              <button aria-label="Previous surah" className="p-2 text-white/50 hover:text-white disabled:opacity-20"
                disabled={surahNo <= 1} onClick={() => changeSurah(surahNo - 1)}>
                <BackwardIcon className="w-5 h-5" />
              </button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                aria-label={playing ? 'Pause' : 'Play'}
                className="w-14 h-14 rounded-full grid place-items-center text-white shadow-lg bg-gradient-to-br from-teal-500 to-emerald-600"
                onClick={togglePlay}
              >
                {buffering ? <span className="loading loading-spinner loading-sm" /> : playing ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0.5" />}
              </motion.button>
              <button aria-label="Next surah" className="p-2 text-white/50 hover:text-white disabled:opacity-20"
                disabled={surahNo >= 114} onClick={() => changeSurah(surahNo + 1)}>
                <ForwardIcon className="w-5 h-5" />
              </button>
            </div>

            {/* progress */}
            <div className="flex items-center gap-2 text-[10px] text-white/35">
              <span className="w-9 text-right">{fmtClock(progress)}</span>
              <input
                type="range" min={0} max={100} step={0.1}
                aria-label="Seek"
                value={duration ? (progress / duration) * 100 : 0}
                onChange={seek}
                className="range range-xs flex-1 [--range-shdw:theme(colors.teal.400)]"
              />
              <span className="w-9">{fmtClock(duration)}</span>
            </div>

            <audio
              ref={audioRef}
              src={src}
              preload="none"
              onPlay={() => { setPlaying(true); setBuffering(false); }}
              onPause={() => setPlaying(false)}
              onWaiting={() => setBuffering(true)}
              onPlaying={() => setBuffering(false)}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
              onEnded={() => {
                // Flow straight into the next surah, like a khatm session
                if (surahNo < 114) {
                  changeSurah(surahNo + 1);
                  setTimeout(() => void audioRef.current?.play(), 300);
                }
              }}
            />

            <p className="text-white/30 text-[10px] leading-relaxed">
              Every ~3 minutes of listening logs <b className="text-white/50">1 page</b> toward your daily goal
              and streak{user ? '' : ' (sign in to save it)'} — recitation streamed free from the Islamic
              Network CDN. 🌸 During Rayhanah days, listening keeps your Quran connection — and your Noor — alive.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
