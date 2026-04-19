import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import { useZikrStore } from '../store/useZikrStore.js';
import type { CustomMeaning } from '../store/useZikrStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useZikrTypes, useAddZikrType } from '../hooks/useZikrTypes.js';
import { useAnalytics } from '../hooks/useAnalytics.js';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { PlusIcon, MinusIcon, ArrowPathIcon, ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Meanings for all built-in dhikr
const DEFAULT_MEANINGS: Record<string, { arabic: string; transliteration: string; meaning: string }> = {
  SubhanAllah: {
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subḥāna-llāh',
    meaning: 'Glory be to Allah — praising His perfection above all imperfections',
  },
  Alhamdulillah: {
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Al-ḥamdu li-llāh',
    meaning: 'All praise belongs to Allah — gratitude for every blessing, seen and unseen',
  },
  'Allahu Akbar': {
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allāhu Akbar',
    meaning: 'Allah is the Greatest — His greatness transcends all of creation',
  },
  'La ilaha illallah': {
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    transliteration: 'Lā ilāha illā-llāh',
    meaning: 'There is no god but Allah — the declaration of Tawhid, key to Jannah',
  },
  Astaghfirullah: {
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfiru-llāh',
    meaning: 'I seek forgiveness from Allah — the Prophet ﷺ sought forgiveness 70–100 times a day',
  },
  'SubhanAllah wa bihamdihi': {
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subḥāna-llāhi wa bi-ḥamdih',
    meaning: 'Glory be to Allah and all praise is His — light on the tongue, heavy on the scales, beloved to the Most Merciful',
  },
  'La hawla wa la quwwata illa billah': {
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'Lā ḥawla wa lā quwwata illā bi-llāh',
    meaning: 'There is no power and no strength except with Allah — a treasure from the treasures of Jannah',
  },
  'SubhanAllah wal hamdulillah wa la ilaha illAllah wa Allahu akbar': {
    arabic: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ',
    transliteration: 'Subḥāna-llāhi wal-ḥamdu li-llāhi wa lā ilāha illā-llāhu wa-llāhu akbar',
    meaning: 'The four most beloved words to Allah — whoever says them, sins fall as leaves fall from a dry tree',
  },
  'Ayatul Kursi': {
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    transliteration: "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm... (Quran 2:255)",
    meaning: "The Verse of the Throne — the greatest verse in the Quran. Recite after every prayer; nothing prevents entry to Jannah except death",
  },
  'Durud Ibrahim': {
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    transliteration: "Allāhumma ṣalli ʿalā Muḥammadin wa ʿalā āli Muḥammad...",
    meaning: 'Salutations upon the Prophet ﷺ and his family — Allah sends tenfold blessings upon the one who sends one salutation',
  },
};

// Hadith references for built-in dhikr (shown at bottom of counter)
const DHIKR_HADITHS: Record<string, { text: string; source: string; url: string; grade?: string }> = {
  SubhanAllah: {
    text: '"Two words are light on the tongue, heavy on the scale, beloved to the Most Merciful: SubhanAllah wa bihamdihi, SubhanAllah al-Azim."',
    source: 'Ṣaḥīḥ al-Bukhārī 6682',
    url: 'https://sunnah.com/bukhari:6682',
    grade: 'Ṣaḥīḥ',
  },
  Alhamdulillah: {
    text: '"Al-ḥamdu li-llāh fills the scale."',
    source: 'Ṣaḥīḥ Muslim 223',
    url: 'https://sunnah.com/muslim:223',
    grade: 'Ṣaḥīḥ',
  },
  'Allahu Akbar': {
    text: '"The best dhikr is Lā ilāha illā-llāh, and the best supplication is Al-ḥamdu li-llāh."',
    source: 'Sunan al-Tirmidhī 3383',
    url: 'https://sunnah.com/tirmidhi:3383',
    grade: 'Ḥasan',
  },
  'La ilaha illallah': {
    text: '"Renew your faith." They asked: "How?" He said: "Say: Lā ilāha illā-llāh frequently."',
    source: 'Musnad Aḥmad 8695',
    url: 'https://sunnah.com/ahmad:8695',
    grade: 'Ḥasan',
  },
  Astaghfirullah: {
    text: '"I seek forgiveness from Allah and turn to Him in repentance more than seventy times a day."',
    source: 'Ṣaḥīḥ al-Bukhārī 6307',
    url: 'https://sunnah.com/bukhari:6307',
    grade: 'Ṣaḥīḥ',
  },
  'SubhanAllah wa bihamdihi': {
    text: '"Whoever says \'SubhanAllahi wa bihamdihi\' 100 times, his sins will be forgiven even if they were as much as the foam of the sea."',
    source: 'Ṣaḥīḥ al-Bukhārī 6405',
    url: 'https://sunnah.com/bukhari:6405',
    grade: 'Ṣaḥīḥ',
  },
  'La hawla wa la quwwata illa billah': {
    text: '"Shall I not guide you to a treasure from the treasures of Paradise? Say: Lā ḥawla wa lā quwwata illā bi-llāh."',
    source: 'Ṣaḥīḥ al-Bukhārī 4205',
    url: 'https://sunnah.com/bukhari:4205',
    grade: 'Ṣaḥīḥ',
  },
  'SubhanAllah wal hamdulillah wa la ilaha illAllah wa Allahu akbar': {
    text: '"The most beloved words to Allah are four: SubhanAllah, Alhamdulillah, La ilaha illallah, Allahu Akbar — it does not matter which you begin with."',
    source: 'Ṣaḥīḥ Muslim 2137',
    url: 'https://sunnah.com/muslim:2137',
    grade: 'Ṣaḥīḥ',
  },
  'Ayatul Kursi': {
    text: '"Whoever recites Āyat al-Kursī after every obligatory prayer, nothing prevents him from entering Jannah except death."',
    source: 'al-Nasā\'ī (al-Sunan al-Kubrā) — Ṣaḥīḥ by al-Albānī',
    url: 'https://sunnah.com/nasai:9928',
    grade: 'Ṣaḥīḥ',
  },
  'Durud Ibrahim': {
    text: '"Whoever sends blessings upon me once, Allah will send blessings upon him tenfold, and erase ten sins, and raise him ten degrees."',
    source: 'al-Nasā\'ī 1297',
    url: 'https://sunnah.com/nasai:1297',
    grade: 'Ṣaḥīḥ',
  },
};

const PREDEFINED_TYPES = [
  'SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'La ilaha illallah',
  'Astaghfirullah', 'SubhanAllah wa bihamdihi', 'La hawla wa la quwwata illa billah',
  'SubhanAllah wal hamdulillah wa la ilaha illAllah wa Allahu akbar',
  'Ayatul Kursi', 'Durud Ibrahim',
];

const GLOW_PALETTE = [
  { glow: 'rgba(16,185,129,0.9)', ring: 'rgba(16,185,129,0.3)', bar: 'bg-brand-emerald' },
  { glow: 'rgba(245,158,11,0.9)', ring: 'rgba(245,158,11,0.3)', bar: 'bg-brand-gold' },
  { glow: 'rgba(99,102,241,0.9)', ring: 'rgba(99,102,241,0.3)', bar: 'bg-indigo-500' },
  { glow: 'rgba(236,72,153,0.9)', ring: 'rgba(236,72,153,0.3)', bar: 'bg-pink-500' },
  { glow: 'rgba(6,182,212,0.9)', ring: 'rgba(6,182,212,0.3)', bar: 'bg-cyan-500' },
  { glow: 'rgba(168,85,247,0.9)', ring: 'rgba(168,85,247,0.3)', bar: 'bg-purple-500' },
];

export default function ZikrCounter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { types, selected, counts, pending, isFlushing, customMeanings, selectType, increment, decrement, reset, scheduleFlush, setTypes, setCustomMeaning } = useZikrStore();
  const { data: fetchedTypes } = useZikrTypes();
  const addZikrType = useAddZikrType();
  const { data: analyticsData } = useAnalytics(1);

  const currentCount = counts?.[selected] ?? 0;
  const [colorIdx, setColorIdx] = useState(0);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customArabic, setCustomArabic] = useState('');
  const [customMeaningText, setCustomMeaningText] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [customSourceUrl, setCustomSourceUrl] = useState('');
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  // Real-time goal progress:
  // confirmedTotal = what the server last told us (stale until RQ refetch).
  // localTodayTotal = what Zustand has locally (increments immediately on tap).
  // pendingTotal = what hasn't been synced yet.
  // We show max(local, confirmed) so the counter never appears to go backwards.
  const confirmedTotal = analyticsData?.today?.total ?? 0;
  const localTodayTotal = Object.values(counts ?? {}).reduce((a, b) => a + b, 0);
  const pendingTotal = Object.values(pending ?? {}).reduce((a, b) => a + b, 0);
  const effectiveTotal = Math.max(localTodayTotal, confirmedTotal + pendingTotal);

  const dailyGoal = analyticsData?.goal?.dailyTarget ?? null;
  const streakCount = analyticsData?.streak?.currentStreak ?? null;
  const goalProgress = dailyGoal ? Math.min(100, Math.round((effectiveTotal / dailyGoal) * 100)) : null;
  const goalMet = dailyGoal !== null ? effectiveTotal >= dailyGoal : false;

  // After a flush completes, invalidate the analytics cache so the server total catches up
  const wasFlushingRef = useRef(false);
  useEffect(() => {
    if (wasFlushingRef.current && !isFlushing) {
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
    wasFlushingRef.current = isFlushing;
  }, [isFlushing, queryClient]);

  // Guest: warn before tab close if they have unsaved counts
  useEffect(() => {
    if (user) return; // only for guests
    const totalPending = Object.values(pending ?? {}).reduce((a, b) => a + b, 0);
    if (totalPending === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [user, pending]);

  // Escape key closes full-screen mode
  useEffect(() => {
    if (!fullScreen) return;
    const handler = (e: KeyboardEvent) => { if (e.code === 'Escape') setFullScreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullScreen]);

  const color = GLOW_PALETTE[colorIdx % GLOW_PALETTE.length]!;

  // Resolve meaning: default → custom → none
  const meaning = DEFAULT_MEANINGS[selected] ?? (customMeanings[selected]
    ? { arabic: customMeanings[selected].arabic ?? '', transliteration: '', meaning: customMeanings[selected].meaning }
    : null);

  // Merge predefined + server types into local store
  useEffect(() => {
    const serverNames = (fetchedTypes ?? []).map((t) => t.name).filter(Boolean);
    const merged = [...new Set([...PREDEFINED_TYPES, ...serverNames, ...types])];
    if (merged.length !== types.length || merged.some((t, i) => t !== types[i])) {
      setTypes(merged);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedTypes?.length]);

  // Keyboard: Space = increment
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        onIncrement();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onIncrement = () => {
    increment();
    scheduleFlush();
    setColorIdx((i) => (i + 1) % GLOW_PALETTE.length);
  };

  const onDecrement = () => { if (currentCount > 0) decrement(); };

  const onReset = () => {
    if (currentCount === 0) return;
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-gray-800 text-sm">
            Reset <span className="font-bold text-emerald-600">{selected}</span> counter?
            <br />
            <span className="text-gray-500 text-xs">Server-confirmed analytics won't be affected.</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { reset(); toast.dismiss(t.id); toast.success('Counter reset.', { icon: '🔄', duration: 2000 }); }}
              className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-0"
            >Reset</button>
            <button onClick={() => toast.dismiss(t.id)} className="btn btn-sm btn-ghost">Cancel</button>
          </div>
        </div>
      ),
      { duration: 5000, position: 'top-center', style: { background: 'white', padding: '16px', borderRadius: '12px' } }
    );
  };

  const submitCustomZikr = () => {
    const name = customName.trim();
    const meaning = customMeaningText.trim();
    if (!name || !meaning) return;
    addZikrType.mutate(name, {
      onSuccess: () => {
        setCustomMeaning(name, {
          arabic: customArabic.trim() || undefined,
          meaning,
          source: customSource.trim() || undefined,
          sourceUrl: customSourceUrl.trim() || undefined,
        });
        setTypes([...types, name]);
        selectType(name);
        setCustomName(''); setCustomArabic(''); setCustomMeaningText('');
        setCustomSource(''); setCustomSourceUrl('');
        setShowAddCustom(false);
        toast.success(`${name} added!`, { icon: '✨', duration: 3000 });
      },
      onError: () => toast.error('Failed to add dhikr', { duration: 3000 }),
    });
  };

  return (
    <AnimatedBackground variant="ocean">
      <Toaster />

      <div className="max-w-2xl mx-auto px-4 pb-10 pt-4 space-y-5">

        {/* Motivational subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-white/50 text-sm tracking-wide"
        >
          Every count is an act of worship — keep going 🌙
        </motion.p>

        {/* ── Type selector: name | change dropdown | + ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-2 bg-white/8 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          {/* Selected name — glowing accent */}
          <span
            className="font-bold text-sm truncate flex-shrink-0 max-w-[140px] sm:max-w-[180px]"
            style={{ color: color.glow, textShadow: `0 0 12px ${color.glow}60` }}
          >
            {selected}
          </span>

          {/* Separator */}
          <span className="text-white/25 select-none flex-shrink-0">|</span>

          {/* Change dropdown */}
          <select
            value={selected}
            onChange={(e) => selectType(e.target.value)}
            className="flex-1 min-w-0 bg-transparent border-none text-white/60 text-xs focus:outline-none cursor-pointer appearance-none"
            style={{ backgroundImage: 'none' }}
          >
            {types.map((t) => (
              <option key={t} value={t} className="bg-brand-deep text-white">{t}</option>
            ))}
          </select>
          {/* Custom caret */}
          <svg className="w-3.5 h-3.5 text-white/40 flex-shrink-0 -ml-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>

          {/* Add custom */}
          <button
            onClick={() => setShowAddCustom(true)}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all"
            title="Add custom dhikr"
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* ── Counter + meaning card ── */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="relative rounded-3xl border border-white/20 bg-white/8 backdrop-blur-lg shadow-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          {/* Focus mode button */}
          <button
            onClick={() => setFullScreen(true)}
            className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/40 hover:text-white/80 transition-all z-10"
            title="Focus mode (full screen)"
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </button>

          {/* Number */}
          <div className="pt-10 pb-4 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selected}:${currentCount}`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.15, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <div
                  className="text-8xl sm:text-9xl font-black text-white leading-none"
                  style={{
                    textShadow: `0 0 40px ${color.glow}, 0 0 90px ${color.glow}60`,
                    transition: 'text-shadow 0.25s ease',
                  }}
                >
                  {currentCount}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-white/10" />

          {/* Meaning section */}
          <div className="px-6 py-5 text-center space-y-2.5 min-h-[130px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {meaning ? (
                  <>
                    {meaning.arabic && (
                      <p
                        dir="rtl"
                        className="text-2xl sm:text-3xl font-bold text-white"
                        style={{
                          fontFamily: "'Amiri', 'Scheherazade New', serif",
                          textShadow: `0 0 16px ${color.glow}80`,
                        }}
                      >
                        {meaning.arabic}
                      </p>
                    )}
                    {meaning.transliteration && (
                      <p className="text-xs text-white/50 italic tracking-wide">{meaning.transliteration}</p>
                    )}
                    <p className="text-sm text-white/75 leading-relaxed">{meaning.meaning}</p>
                  </>
                ) : (
                  <p className="text-sm text-white/40 italic">Custom dhikr — remember Allah sincerely with every count.</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Card bottom: progress bar + streak + goal% ── */}
          {(dailyGoal !== null || streakCount !== null) && (
            <div className="px-6 pb-5 pt-1">
              {dailyGoal !== null && !goalMet && (
                <>
                  <div className="flex justify-between text-xs text-white/40 mb-1.5">
                    <span>Today: {effectiveTotal}{pendingTotal > 0 ? <span className="text-brand-gold/60"> (+{pendingTotal} syncing)</span> : ''}</span>
                    <span>Goal: {dailyGoal}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      animate={{ width: `${goalProgress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full rounded-full ${color.bar}`}
                    />
                  </div>
                </>
              )}
              {goalMet && (
                <p className="text-sm text-brand-emerald font-bold text-center py-1">🏆 Goal Achieved!</p>
              )}
              <div className="flex items-center justify-between mt-2.5">
                {streakCount !== null ? (
                  <span className="text-brand-gold text-xs font-bold">🔥 {streakCount} day streak</span>
                ) : <span />}
                {goalProgress !== null ? (
                  <span className={`text-xs font-bold ${goalMet ? 'text-brand-emerald' : 'text-white/50'}`}>
                    {goalMet ? '✓ 100%' : `🎯 ${goalProgress}%`}
                  </span>
                ) : <span />}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Action buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-3 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.93 }}
            onClick={onDecrement}
            disabled={currentCount === 0}
            className="btn btn-circle bg-white/15 hover:bg-white/25 border-white/20 text-white backdrop-blur-sm disabled:opacity-25"
          >
            <MinusIcon className="w-6 h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, backgroundColor: '#e6faf4' }}
            whileTap={{ scale: 0.96, backgroundColor: '#d1fae5' }}
            onClick={onIncrement}
            className="flex items-center justify-center gap-2 w-44 sm:w-56 h-14 rounded-2xl text-brand-deep font-bold text-lg cursor-pointer select-none outline-none border-0"
            style={{ backgroundColor: 'white', boxShadow: `0 8px 32px ${color.glow}50` }}
          >
            <PlusIcon className="w-6 h-6" />
            Count
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.93 }}
            onClick={onReset}
            disabled={currentCount === 0}
            className="btn btn-circle bg-white/15 hover:bg-red-500/70 border-white/20 text-white backdrop-blur-sm disabled:opacity-25 transition-colors"
          >
            <ArrowPathIcon className="w-6 h-6" />
          </motion.button>
        </motion.div>

        {/* Keyboard hint */}
        <p className="text-center text-white/35 text-xs">
          Press <kbd className="kbd kbd-xs bg-white/15 text-white border-white/20">Space</kbd> to count
        </p>

        {/* ── Hadith reference for selected dhikr ── */}
        {(() => {
          const builtin = DHIKR_HADITHS[selected];
          const custom = customMeanings[selected];
          const hasRef = builtin || (custom?.source || custom?.sourceUrl);
          if (!hasRef) return null;
          return (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.25 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3 space-y-1.5"
            >
              <p className="text-white/25 text-[10px] uppercase tracking-widest font-bold">📖 Hadith Reference</p>
              {builtin ? (
                <>
                  <p className="text-white/60 text-xs italic leading-relaxed">{builtin.text}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {builtin.grade && (
                      <span className="text-brand-emerald/60 text-[10px] font-semibold bg-brand-emerald/10 px-2 py-0.5 rounded-full">
                        {builtin.grade}
                      </span>
                    )}
                    <a href={builtin.url} target="_blank" rel="noopener noreferrer"
                      className="text-brand-gold/60 text-[10px] underline hover:text-brand-gold/90 transition-colors">
                      {builtin.source} ↗
                    </a>
                  </div>
                </>
              ) : custom?.source ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {custom.sourceUrl ? (
                    <a href={custom.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="text-brand-gold/60 text-[10px] underline hover:text-brand-gold/90 transition-colors">
                      {custom.source} ↗
                    </a>
                  ) : (
                    <span className="text-white/40 text-xs">{custom.source}</span>
                  )}
                </div>
              ) : null}
            </motion.div>
          );
        })()}
      </div>

      {/* ── Full-screen focus mode overlay (portal → above Navbar stacking context) ── */}
      {createPortal(
        <AnimatePresence>
        {fullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex flex-col"
            style={{
              background: `radial-gradient(circle at 50% 55%, ${color.glow}22 0%, ${color.glow}07 38%, #080c12 72%)`,
              transition: 'background 0.35s ease',
            }}
          >
            {/* Top bar: zikr selector (left) + close (right) */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2 flex-shrink-0">
              <div className="flex items-center gap-1 opacity-50 hover:opacity-80 transition-opacity">
                <span className="text-white text-sm font-medium truncate max-w-[180px] sm:max-w-xs"
                  style={{ color: color.glow, textShadow: `0 0 10px ${color.glow}50` }}>
                  {selected}
                </span>
                <select
                  value={selected}
                  onChange={(e) => selectType(e.target.value)}
                  className="bg-transparent border-none text-white/40 text-xs focus:outline-none cursor-pointer appearance-none ml-0.5"
                  style={{ backgroundImage: 'none' }}
                >
                  {types.map((t) => (
                    <option key={t} value={t} className="bg-brand-deep text-white">{t}</option>
                  ))}
                </select>
                <svg className="w-3 h-3 text-white/30 -ml-3 pointer-events-none flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <button
                onClick={() => setFullScreen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-all"
                title="Exit focus mode (Esc)"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Center content */}
            <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 pb-12">
              {/* Arabic + meaning (muted, above counter) */}
              {meaning && (
                <motion.div
                  key={`fs-meaning:${selected}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center opacity-35 space-y-1.5 max-w-sm"
                >
                  {meaning.arabic && (
                    <p
                      dir="rtl"
                      className="text-3xl sm:text-4xl text-white"
                      style={{
                        fontFamily: "'Amiri', 'Scheherazade New', serif",
                        textShadow: `0 0 20px ${color.glow}50`,
                      }}
                    >
                      {meaning.arabic}
                    </p>
                  )}
                  <p className="text-white text-xs leading-relaxed">{meaning.meaning}</p>
                </motion.div>
              )}

              {/* Counter number */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`fs:${selected}:${currentCount}`}
                  initial={{ scale: 0.82, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.18, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <div
                    className="text-[9rem] sm:text-[13rem] font-black text-white leading-none text-center tabular-nums"
                    style={{
                      textShadow: `0 0 60px ${color.glow}, 0 0 120px ${color.glow}50`,
                      transition: 'text-shadow 0.25s ease',
                    }}
                  >
                    {currentCount}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Count button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={onIncrement}
                className="flex items-center justify-center gap-2.5 w-56 sm:w-72 h-16 rounded-2xl text-brand-deep font-bold text-xl cursor-pointer select-none outline-none border-0"
                style={{
                  backgroundColor: 'white',
                  boxShadow: `0 8px 48px ${color.glow}55`,
                  transition: 'box-shadow 0.3s ease',
                }}
              >
                <PlusIcon className="w-7 h-7" />
                Count
              </motion.button>

              {/* Streak + goal% (subtle, below button) */}
              {(streakCount !== null || goalProgress !== null) && (
                <div className="flex items-center gap-5 opacity-50">
                  {streakCount !== null && (
                    <span className="text-brand-gold text-xs font-bold">🔥 {streakCount} day streak</span>
                  )}
                  {goalProgress !== null && (
                    <span className={`text-xs font-bold ${goalMet ? 'text-brand-emerald' : 'text-white/70'}`}>
                      {goalMet ? '🏆 Goal Achieved!' : `🎯 ${goalProgress}%`}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}

      {/* ── Add custom dhikr modal ── */}
      <AnimatePresence>
        {showAddCustom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddCustom(false); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-brand-surface rounded-3xl p-6 w-full max-w-md shadow-2xl border border-brand-border"
            >
              <h3 className="text-xl font-bold text-brand-emerald mb-1">Add Custom Dhikr</h3>
              <p className="text-white/40 text-xs mb-5">Name and meaning are required. Arabic is optional but recommended.</p>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">
                    Dhikr Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Astaghfirullah"
                    className="input input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-sm"
                    autoFocus
                  />
                </div>

                {/* Arabic */}
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">
                    Arabic Text <span className="text-white/30">(optional)</span>
                  </label>
                  <input
                    value={customArabic}
                    onChange={(e) => setCustomArabic(e.target.value)}
                    placeholder="أَسْتَغْفِرُ اللَّهَ"
                    dir="rtl"
                    className="input input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-base"
                    style={{ fontFamily: "'Amiri', serif" }}
                  />
                </div>

                {/* Meaning */}
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">
                    English Meaning <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={customMeaningText}
                    onChange={(e) => setCustomMeaningText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitCustomZikr(); if (e.key === 'Escape') setShowAddCustom(false); }}
                    placeholder="e.g. I seek forgiveness from Allah"
                    className="input input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-sm"
                  />
                </div>

                {/* Hadith reference (optional) */}
                <div className="border-t border-brand-border/60 pt-3 space-y-2">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider">Hadith Reference <span className="normal-case text-white/20">(optional)</span></p>
                  <input
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="e.g. Ṣaḥīḥ al-Bukhārī 6307"
                    className="input input-sm input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-xs"
                  />
                  <input
                    value={customSourceUrl}
                    onChange={(e) => setCustomSourceUrl(e.target.value)}
                    placeholder="https://sunnah.com/..."
                    className="input input-sm input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowAddCustom(false); setCustomName(''); setCustomArabic(''); setCustomMeaningText(''); }}
                  className="btn flex-1 btn-ghost text-white/60 border-brand-border"
                >
                  Cancel
                </button>
                <button
                  onClick={submitCustomZikr}
                  disabled={!customName.trim() || !customMeaningText.trim() || addZikrType.isPending}
                  className="btn flex-1 bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 font-bold"
                >
                  {addZikrType.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Add Dhikr'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Guest data-loss dialog ── */}
      <AnimatePresence>
        {showGuestDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 22 }}
              className="bg-brand-surface rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-brand-border text-center"
            >
              <div className="text-5xl mb-4">📿</div>
              <h3 className="text-xl font-black text-white mb-2">Don't lose your counts</h3>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                You have <span className="text-brand-gold font-bold">
                  {Object.values(pending ?? {}).reduce((a, b) => a + b, 0)}
                </span> unsaved zikr counts. Sign in to save your progress and track your streaks.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  className="btn bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 w-full"
                  onClick={() => {
                    sessionStorage.setItem('ihsan_redirect', '/zikr');
                    navigate('/login');
                  }}
                >
                  Sign In to Save
                </button>
                <button
                  className="btn btn-ghost text-white/50 hover:text-white w-full"
                  onClick={() => { setShowGuestDialog(false); navigate('/'); }}
                >
                  Leave without saving
                </button>
                <button
                  className="btn btn-ghost text-brand-emerald text-sm w-full"
                  onClick={() => setShowGuestDialog(false)}
                >
                  Keep counting
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedBackground>
  );
}
