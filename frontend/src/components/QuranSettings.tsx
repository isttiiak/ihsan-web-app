import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useQuranSummary, useUpdateQuranProfile } from '../hooks/useQuran.js';
import { TRANSLATIONS, selectedTranslations } from '../utils/quranData.js';

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

function FontPicker({ label, storageKey }: { label: string; storageKey: string }) {
  const [v, setV] = useState<number>(() => {
    const n = Number(localStorage.getItem(storageKey));
    return n >= 0 && n <= 2 ? n : 1;
  });
  return (
    <div>
      <p className="text-white/50 text-xs font-bold mb-1.5">{label}</p>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <button key={i}
            className={`flex-1 btn btn-xs rounded-xl ${v === i ? 'bg-brand-emerald/25 border-brand-emerald/40 text-brand-emerald' : 'bg-white/5 border-white/10 text-white/50'}`}
            style={{ fontSize: 11 + i * 3 }}
            onClick={() => { setV(i); localStorage.setItem(storageKey, String(i)); }}
          >Aa</button>
        ))}
      </div>
    </div>
  );
}

export default function QuranSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: summary } = useQuranSummary();
  const updateProfile = useUpdateQuranProfile();

  const [goal, setGoal] = useState<string>('');
  const [reciter, setReciter] = useState(() => localStorage.getItem('ihsan_reciter') || 'dossari');
  const [translations, setTranslations] = useState<string[]>(selectedTranslations);

  const goalValue = goal === '' ? (summary?.profile.dailyGoalAyat ?? 20) : Number(goal);
  const primary = translations[0] ?? 'en.sahih';
  const secondary = translations[1] ?? 'none';

  const setPrimary = (id: string) => {
    setTranslations((t) => {
      const sec = t[1] && t[1] !== id ? [t[1]] : [];
      return [id, ...sec];
    });
  };
  const setSecondary = (id: string) => {
    setTranslations((t) => (id === 'none' || id === t[0] ? [t[0] ?? 'en.sahih'] : [t[0] ?? 'en.sahih', id]));
  };

  const save = () => {
    if (goalValue >= 1 && goalValue <= 6236 && goalValue !== summary?.profile.dailyGoalAyat) {
      updateProfile.mutate({ dailyGoalAyat: goalValue }, {
        onSuccess: () => toast.success(`Daily goal set: ${goalValue} āyāt 🎯`, { id: 'quran-goal' }),
      });
    }
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
            <div className="sticky top-0 bg-brand-deep/95 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-white font-black text-lg">⚙️ Quran settings</h3>
              <button aria-label="Close settings" className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10" onClick={onClose}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="text-white/50 text-xs font-bold" htmlFor="q-goal">🎯 Daily goal (āyāt per day)</label>
                <input
                  id="q-goal" type="number" min={1} max={6236}
                  value={goal === '' ? (summary?.profile.dailyGoalAyat ?? 20) : goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="input input-bordered input-sm w-full mt-1.5 bg-white/5 border-white/10 text-white"
                />
                <p className="text-white/25 text-[10px] mt-1 leading-relaxed">
                  ~10 āyāt ≈ 1 mushaf page. Reading anywhere counts — khatam, browsing, special
                  selections, even listening.
                </p>
              </div>

              <div>
                <label className="text-white/50 text-xs font-bold" htmlFor="q-reciter">🎙️ Default reciter</label>
                <select id="q-reciter" className="select select-sm w-full mt-1.5 bg-white/5 border-white/10 text-white rounded-xl"
                  value={reciter} onChange={(e) => setReciter(e.target.value)}>
                  {RECITER_OPTIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <p className="text-white/25 text-[10px] mt-1">Used by the Listen tab. The single-āyah recitation in the reader uses Alafasy (the only free per-āyah source).</p>
              </div>

              <div className="space-y-2.5">
                <p className="text-white/50 text-xs font-bold">🌐 Translations <span className="text-white/25 font-normal">(up to two shown together)</span></p>
                <div>
                  <label className="text-white/35 text-[10px] font-bold" htmlFor="q-tr1">Primary</label>
                  <select id="q-tr1" className="select select-sm w-full mt-1 bg-white/5 border-white/10 text-white rounded-xl"
                    value={primary} onChange={(e) => setPrimary(e.target.value)}>
                    {TRANSLATIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/35 text-[10px] font-bold" htmlFor="q-tr2">Second (optional)</label>
                  <select id="q-tr2" className="select select-sm w-full mt-1 bg-white/5 border-white/10 text-white rounded-xl"
                    value={secondary} onChange={(e) => setSecondary(e.target.value)}>
                    <option value="none">None — one translation only</option>
                    {TRANSLATIONS.filter((t) => t.id !== primary).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FontPicker label="🔤 Arabic size" storageKey="ihsan_quran_font" />
                <FontPicker label="🔡 Translation size" storageKey="ihsan_quran_font_tr" />
              </div>

              <div className="rounded-2xl bg-white/3 border border-white/8 p-3">
                <p className="text-white/45 text-xs leading-relaxed">
                  🔖 Your saved āyāt now live in their own <b className="text-white/70">Saved</b> tab —
                  organized by surah, one tap back into the reader.
                </p>
              </div>

              <button
                className="w-full btn btn-sm h-11 rounded-2xl border-0 text-white font-black bg-gradient-to-r from-emerald-500 to-teal-500"
                onClick={save}
              >
                Save settings
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
