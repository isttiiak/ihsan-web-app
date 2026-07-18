import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuranSummary, useUpdateQuranProfile, useToggleBookmark } from '../hooks/useQuran.js';

/**
 * Dedicated Quran settings (Istiak's spec): default reciter, translation,
 * saved ayat, reading style, daily AYAT goal, font size.
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

const READING_STYLES = [
  { id: 'ayah', label: 'Āyah by āyah' },
  { id: 'surah', label: 'Surah by surah' },
  { id: 'page', label: 'Page amounts' },
];

export default function QuranSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: summary } = useQuranSummary();
  const updateProfile = useUpdateQuranProfile();
  const toggleBookmark = useToggleBookmark();

  const [goal, setGoal] = useState<string>('');
  const [reciter, setReciter] = useState(() => localStorage.getItem('ihsan_reciter') || 'dossari');
  const [font, setFont] = useState<number>(() => Number(localStorage.getItem('ihsan_quran_font')) || 1);
  const [style, setStyle] = useState(() => localStorage.getItem('ihsan_quran_style') || 'ayah');

  const goalValue = goal === '' ? (summary?.profile.dailyGoalAyat ?? 20) : Number(goal);

  const save = () => {
    if (goalValue >= 1 && goalValue <= 6236 && goalValue !== summary?.profile.dailyGoalAyat) {
      updateProfile.mutate({ dailyGoalAyat: goalValue }, {
        onSuccess: () => toast.success(`Daily goal set: ${goalValue} āyāt 🎯`, { id: 'quran-goal' }),
      });
    }
    localStorage.setItem('ihsan_reciter', reciter);
    localStorage.setItem('ihsan_quran_font', String(font));
    localStorage.setItem('ihsan_quran_style', style);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
            className="w-full max-w-md rounded-3xl bg-brand-deep border border-brand-border p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-black text-lg">⚙️ Quran settings</h3>

            <div>
              <label className="text-white/50 text-xs font-bold" htmlFor="q-goal">Daily goal (āyāt per day)</label>
              <input
                id="q-goal" type="number" min={1} max={6236}
                value={goal === '' ? (summary?.profile.dailyGoalAyat ?? 20) : goal}
                onChange={(e) => setGoal(e.target.value)}
                className="input input-bordered input-sm w-full mt-1 bg-white/5 border-white/10 text-white"
              />
              <p className="text-white/25 text-[10px] mt-1">
                ~10 āyāt ≈ 1 mushaf page. Reading anywhere counts — khatam, browsing, bundles, even listening.
              </p>
            </div>

            <div>
              <label className="text-white/50 text-xs font-bold" htmlFor="q-reciter">Default reciter</label>
              <select id="q-reciter" className="select select-sm w-full mt-1 bg-white/5 border-white/10 text-white rounded-xl"
                value={reciter} onChange={(e) => setReciter(e.target.value)}>
                {RECITER_OPTIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-white/50 text-xs font-bold" htmlFor="q-translation">Translation</label>
              <select id="q-translation" className="select select-sm w-full mt-1 bg-white/5 border-white/10 text-white/50 rounded-xl" disabled>
                <option>Ṣaḥīḥ International (English) — more coming soon</option>
              </select>
            </div>

            <div>
              <p className="text-white/50 text-xs font-bold mb-1.5">How do you like to read?</p>
              <div className="flex gap-2">
                {READING_STYLES.map((r) => (
                  <button key={r.id}
                    className={`flex-1 btn btn-xs rounded-xl ${style === r.id ? 'bg-brand-emerald/25 border-brand-emerald/40 text-brand-emerald' : 'bg-white/5 border-white/10 text-white/50'}`}
                    onClick={() => setStyle(r.id)}
                  >{r.label}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-white/50 text-xs font-bold mb-1.5">Arabic font size</p>
              <div className="flex gap-2">
                {['Aa', 'Aa', 'Aa'].map((t, i) => (
                  <button key={i}
                    className={`flex-1 btn btn-xs rounded-xl ${font === i ? 'bg-brand-emerald/25 border-brand-emerald/40 text-brand-emerald' : 'bg-white/5 border-white/10 text-white/50'}`}
                    style={{ fontSize: 11 + i * 3 }}
                    onClick={() => setFont(i)}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Bookmarks */}
            <div>
              <p className="text-white/50 text-xs font-bold mb-1.5">🔖 Saved āyāt ({summary?.bookmarks?.length ?? 0})</p>
              {(summary?.bookmarks ?? []).length === 0 ? (
                <p className="text-white/25 text-[11px]">Tap the bookmark icon on any āyah while reading.</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {(summary?.bookmarks ?? []).map((b) => (
                    <div key={`${b.surah}:${b.ayah}`} className="flex items-center gap-2 rounded-lg bg-white/3 px-2.5 py-1.5 text-xs">
                      <button
                        className="text-brand-emerald font-bold flex-1 text-left"
                        onClick={() => { onClose(); navigate(`/quran/read/${b.surah}?start=${b.ayah}`); }}
                      >Surah {b.surah}, āyah {b.ayah} →</button>
                      <button aria-label="Remove bookmark" className="text-white/25 hover:text-red-300"
                        onClick={() => toggleBookmark.mutate({ surah: b.surah, ayah: b.ayah })}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="w-full btn btn-sm rounded-2xl border-0 text-white font-black bg-gradient-to-r from-emerald-500 to-teal-500" onClick={save}>
              Save settings
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
