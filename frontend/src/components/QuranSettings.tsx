import { useEffect, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useQuranSummary, useUpdateQuranProfile, useResetKhatam } from '../hooks/useQuran.js';
import { TRANSLATIONS, selectedTranslations } from '../utils/quranData.js';
import {
  ARABIC_FONTS, getArabicFont, setArabicFont,
  FONT_RANGES, getFontPx, setFontPx, type FontKind,
  translitEnabled, setTranslitEnabled,
} from '../utils/quranPrefs.js';
import ConfirmDialog from './ConfirmDialog.js';

/**
 * Quran settings — a right-side DRAWER (Istiak's spec), available from every
 * Quran tab. Manages: daily āyāt goal, default reciter, up to TWO
 * translations (English + Bengali), Arabic & translation font sizes.
 */
const RECITER_OPTIONS = [
  { id: 'dossari', name: 'Yasser Al-Dossari (default)' },
  { id: 'alafasy', name: 'Mishary Alafasy' },
  { id: 'abdulbasit', name: 'Abdul Basit (Murattal)' },
  { id: 'husary', name: 'Mahmoud Al-Husary' },
  { id: 'sudais', name: 'Abdur-Rahman As-Sudais' },
  { id: 'maher', name: 'Maher Al-Muaiqly' },
  { id: 'minshawi', name: 'Muhammad Al-Minshawi' },
];

/** Free-range px slider (Istiak's spec: full flexibility, not 3 steps).
 * Writes straight to localStorage — the reader picks it up on next open. */
function SizeSlider({ label, kind, sample, sampleStyle }: {
  label: string; kind: FontKind; sample?: string; sampleStyle?: CSSProperties;
}) {
  const { min, max } = FONT_RANGES[kind];
  const [v, setV] = useState<number>(() => getFontPx(kind));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-white/50 text-xs font-bold">{label}</p>
        <span className="text-white/30 text-[10px] tabular-nums">{v}px</span>
      </div>
      <input
        type="range" min={min} max={max} value={v}
        aria-label={`${label} size`}
        onChange={(e) => { const n = Number(e.target.value); setV(n); setFontPx(kind, n); }}
        className="range range-xs w-full [--range-shdw:theme(colors.emerald.400)]"
      />
      {sample && (
        <p className="text-white/60 mt-1 truncate" style={{ fontSize: v, ...sampleStyle }}>{sample}</p>
      )}
    </div>
  );
}

const GOAL_PRESETS = [1, 3, 5, 10, 20];

export default function QuranSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: summary } = useQuranSummary();
  const updateProfile = useUpdateQuranProfile();
  const resetKhatam = useResetKhatam();

  const savedGoal = summary?.profile.dailyGoalAyat ?? 0;
  const [goal, setGoal] = useState<number>(savedGoal);
  const [reciter, setReciter] = useState(() => localStorage.getItem('ihsan_reciter') || 'dossari');
  const [translations, setTranslations] = useState<string[]>(selectedTranslations);
  const [arabicFontId, setArabicFontId] = useState(() => getArabicFont().id);
  const [translit, setTranslit] = useState(translitEnabled);
  // danger-zone double confirm: inline tap → ConfirmDialog (app-wide rule)
  const [confirmDanger, setConfirmDanger] = useState<null | 'khatam' | 'goal'>(null);

  // Keep the local goal field in sync when the drawer (re)opens with fresh data
  useEffect(() => { if (open) setGoal(summary?.profile.dailyGoalAyat ?? 0); }, [open, summary?.profile.dailyGoalAyat]);

  const primary = translations[0] ?? 'en.sahih';
  const secondary = translations[1] ?? 'none';
  const goalDirty = goal !== savedGoal;

  const setPrimary = (id: string) => {
    setTranslations((t) => {
      const sec = t[1] && t[1] !== id ? [t[1]] : [];
      return [id, ...sec];
    });
  };
  const setSecondary = (id: string) => {
    setTranslations((t) => (id === 'none' || id === t[0] ? [t[0] ?? 'en.sahih'] : [t[0] ?? 'en.sahih', id]));
  };

  // Dedicated goal save (its own button — Istiak's spec). 0 = no goal.
  const saveGoal = () => {
    const g = Math.min(6236, Math.max(0, Math.round(goal) || 0));
    setGoal(g);
    if (g === savedGoal) { toast('Goal unchanged', { id: 'quran-goal' }); return; }
    updateProfile.mutate({ dailyGoalAyat: g }, {
      onSuccess: () => toast.success(g > 0 ? `Daily goal set: ${g} āyah${g > 1 ? 's' : ''} 🎯` : 'Goal removed — read freely 🌿', { id: 'quran-goal' }),
      onError: () => toast.error('Could not save the goal — try again.', { id: 'quran-goal' }),
    });
  };

  // Everything EXCEPT the goal (reciter, translations, fonts) — its own button
  const save = () => {
    localStorage.setItem('ihsan_reciter', reciter);
    localStorage.setItem('ihsan_quran_translations', JSON.stringify(translations));
    toast.success('Quran settings saved ✓', { id: 'quran-settings' });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 bottom-0 z-[55] w-full max-w-sm bg-brand-deep border-l border-brand-border overflow-y-auto"
            role="dialog" aria-label="Quran settings"
          >
            <div className="sticky top-0 bg-brand-deep/95 backdrop-blur border-b border-slate-400/5 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-white font-black text-lg">⚙️ Quran settings</h3>
              <button aria-label="Close settings" className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10" onClick={onClose}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* ── Dedicated: Daily Quran goal (its own save button) ── */}
              <div className="rounded-2xl border border-brand-emerald/25 bg-brand-emerald/[0.06] p-4">
                <p className="text-white font-black text-sm">🎯 Daily Quran goal</p>
                <p className="text-white/40 text-[11px] mt-0.5 leading-relaxed">
                  Completely optional — set it only when YOU want a daily target. Start small: even{' '}
                  <b className="text-white/60">1 āyah a day</b> keeps the habit alive. Reading anywhere counts.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <button
                    onClick={() => setGoal(0)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      goal === 0
                        ? 'bg-white/15 text-white border-slate-300/40'
                        : 'bg-white/5 border-slate-400/15 text-white/60 hover:border-slate-300/40'
                    }`}
                  >No goal</button>
                  {GOAL_PRESETS.map((p) => (
                    <button key={p}
                      onClick={() => setGoal(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        goal === p
                          ? 'bg-brand-emerald text-white border-brand-emerald'
                          : 'bg-white/5 border-slate-400/15 text-white/60 hover:border-brand-emerald/40'
                      }`}
                    >{p} āyah{p > 1 ? 's' : ''}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <label className="text-white/40 text-[11px] font-bold shrink-0" htmlFor="q-goal">Custom</label>
                  <input
                    id="q-goal" type="number" min={0} max={6236}
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                    className="input input-bordered input-sm flex-1 bg-white/5 border-slate-400/15 text-white"
                  />
                  <span className="text-white/30 text-[11px]">/ day</span>
                </div>
                <button
                  className="w-full btn btn-sm h-10 mt-3 rounded-xl border-0 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-50"
                  onClick={saveGoal}
                  disabled={!goalDirty || updateProfile.isPending}
                >
                  {updateProfile.isPending ? <span className="loading loading-spinner loading-xs" /> : goalDirty ? 'Save goal' : 'Goal saved ✓'}
                </button>
              </div>

              <div className="border-t border-slate-400/10 pt-4">
                <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider mb-3">Reading & audio</p>
              </div>

              <div>
                <label className="text-white/50 text-xs font-bold" htmlFor="q-reciter">🎙️ Default reciter</label>
                <select id="q-reciter" className="select select-sm w-full mt-1.5 bg-white/5 border-slate-400/10 text-white rounded-xl"
                  value={reciter} onChange={(e) => setReciter(e.target.value)}>
                  {RECITER_OPTIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <p className="text-white/25 text-[10px] mt-1">Used by the Listen tab. The single-āyah recitation in the reader uses Alafasy (the only free per-āyah source).</p>
              </div>

              <div className="space-y-2.5">
                <p className="text-white/50 text-xs font-bold">🌐 Translations <span className="text-white/25 font-normal">(up to two shown together)</span></p>
                <div>
                  <label className="text-white/35 text-[10px] font-bold" htmlFor="q-tr1">Primary</label>
                  <select id="q-tr1" className="select select-sm w-full mt-1 bg-white/5 border-slate-400/10 text-white rounded-xl"
                    value={primary} onChange={(e) => setPrimary(e.target.value)}>
                    {TRANSLATIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/35 text-[10px] font-bold" htmlFor="q-tr2">Second (optional)</label>
                  <select id="q-tr2" className="select select-sm w-full mt-1 bg-white/5 border-slate-400/10 text-white rounded-xl"
                    value={secondary} onChange={(e) => setSecondary(e.target.value)}>
                    <option value="none">None — one translation only</option>
                    {TRANSLATIONS.filter((t) => t.id !== primary).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* ── Arabic font — the "clean" default is the easiest to read ── */}
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-4 space-y-2">
                <p className="text-white/60 text-xs font-bold">🔤 Arabic font</p>
                <select
                  aria-label="Arabic font"
                  className="select select-sm w-full bg-white/5 border-purple-400/15 text-white rounded-xl"
                  value={arabicFontId}
                  onChange={(e) => { setArabicFontId(e.target.value); setArabicFont(e.target.value); }}
                >
                  {ARABIC_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <p dir="rtl" lang="ar" className="text-white/85 text-2xl leading-loose text-center pt-1"
                  style={{ fontFamily: ARABIC_FONTS.find((f) => f.id === arabicFontId)?.stack }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>

              {/* ── Transliteration (pronunciation aid, free source) ── */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-white/70 text-sm font-bold">🗣️ Transliteration</p>
                    <p className="text-white/35 text-[11px] mt-0.5">Latin pronunciation under the Arabic — for readers still learning the script.</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-sm toggle-warning"
                    checked={translit}
                    onChange={(e) => { setTranslit(e.target.checked); setTranslitEnabled(e.target.checked); }} />
                </label>
              </div>

              {/* ── Text sizes — one slider per text kind (Istiak's spec) ── */}
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] p-4 space-y-4">
                <p className="text-white/60 text-xs font-bold">📏 Text sizes</p>
                <SizeSlider label="Arabic" kind="arabic" sample="بِسْمِ اللَّهِ"
                  sampleStyle={{ fontFamily: ARABIC_FONTS.find((f) => f.id === arabicFontId)?.stack, direction: 'rtl' }} />
                <SizeSlider label="Translation" kind="translation" sample="In the name of Allah…" />
                <SizeSlider label="Transliteration" kind="translit" sample="Bismillāhir-raḥmānir-raḥīm" />
                <SizeSlider label="Tafsir" kind="tafsir" sample="The scholars explain…" />
              </div>

              <button
                className="w-full btn btn-sm h-11 rounded-2xl border-0 text-white font-black bg-gradient-to-r from-emerald-500 to-teal-500"
                onClick={save}
              >
                Save reading settings
              </button>

              {/* ── Danger zone — restart options with proper double-confirm ── */}
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4 space-y-2.5">
                <p className="text-red-400/70 text-[11px] uppercase tracking-widest font-bold">Danger zone</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm font-semibold">🕋 Reset khatam journey</p>
                    <p className="text-white/35 text-[11px]">Bookmark returns to 1:1 and the journey un-starts. Completed khatm count stays.</p>
                  </div>
                  <button className="btn btn-xs rounded-lg bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 shrink-0"
                    onClick={() => setConfirmDanger('khatam')}>Reset</button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm font-semibold">🎯 Remove reading goal</p>
                    <p className="text-white/35 text-[11px]">Back to no daily target — reading still counts and history stays.</p>
                  </div>
                  <button className="btn btn-xs rounded-lg bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 shrink-0"
                    disabled={savedGoal === 0}
                    onClick={() => setConfirmDanger('goal')}>Remove</button>
                </div>
              </div>
            </div>

            <ConfirmDialog
              open={confirmDanger !== null}
              title={confirmDanger === 'khatam' ? 'Reset your khatam journey?' : 'Remove your reading goal?'}
              message={confirmDanger === 'khatam'
                ? 'Your bookmark goes back to the very beginning (1:1) and the journey becomes un-started. Your completed khatm count and reading history are kept.'
                : 'Your daily āyah target will be removed. Reading still counts toward your history — there will simply be no goal ring.'}
              confirmLabel={confirmDanger === 'khatam' ? 'Yes, reset khatam' : 'Yes, remove goal'}
              onConfirm={() => {
                if (confirmDanger === 'khatam') {
                  resetKhatam.mutate(undefined, {
                    onSuccess: () => toast.success('Khatam journey reset 🕋', { id: 'khatam-reset' }),
                    onError: () => toast.error('Could not reset — try again.', { id: 'khatam-reset' }),
                  });
                } else if (confirmDanger === 'goal') {
                  updateProfile.mutate({ dailyGoalAyat: 0 }, {
                    onSuccess: () => { setGoal(0); toast.success('Reading goal removed 🌿', { id: 'quran-goal' }); },
                    onError: () => toast.error('Could not save — try again.', { id: 'quran-goal' }),
                  });
                }
                setConfirmDanger(null);
              }}
              onCancel={() => setConfirmDanger(null)}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
