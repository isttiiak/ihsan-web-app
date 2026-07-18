import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useZikrStore } from '../store/useZikrStore.js';
import { useAddZikrType } from '../hooks/useZikrTypes.js';
import { ZIKR_LIBRARY } from '../utils/zikrLibrary.js';

/**
 * 📿 The zikr library (Istiak's plan) — a curated, categorized, hadith-
 * verified collection in Settings. Users add what they want to their OWN
 * counter list; the database defaults stay untouched. Custom adhkār can be
 * added here too.
 */
export default function ZikrLibrarySection() {
  const { types, setTypes, setCustomMeaning } = useZikrStore();
  const addZikrType = useAddZikrType();
  const [openCat, setOpenCat] = useState<string | null>('salawat');
  const [customName, setCustomName] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  const inList = (name: string) => types.some((t) => t.toLowerCase() === name.toLowerCase());

  const addFromLibrary = (item: { name: string; arabic: string; meaning: string; source: string; sourceUrl: string }) => {
    if (inList(item.name)) return;
    setAdding(item.name);
    addZikrType.mutate(item.name, {
      onSuccess: () => {
        setTypes([...types, item.name]);
        setCustomMeaning(item.name, {
          arabic: item.arabic,
          meaning: item.meaning,
          source: item.source,
          sourceUrl: item.sourceUrl,
        });
        toast.success(`"${item.name}" added to your counter 📿`, { id: 'lib-add' });
        setAdding(null);
      },
      onError: () => { toast.error('Could not add — try again.', { id: 'lib-add' }); setAdding(null); },
    });
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    if (name.includes('.') || name.startsWith('$')) { toast.error('Name may not contain "." or start with "$"'); return; }
    if (inList(name)) { toast('Already in your list ✓', { id: 'lib-custom' }); return; }
    setAdding(name);
    addZikrType.mutate(name, {
      onSuccess: () => {
        setTypes([...types, name]);
        toast.success(`"${name}" added 📿`, { id: 'lib-custom' });
        setCustomName('');
        setAdding(null);
      },
      onError: () => { toast.error('Could not add — try again.', { id: 'lib-custom' }); setAdding(null); },
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-white/40 text-xs leading-relaxed">
        Add any of these to your counter's dropdown — every reference is verified. Your existing
        list stays exactly as it is.
      </p>

      {ZIKR_LIBRARY.map((cat) => (
        <div key={cat.id} className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
          <button
            className="w-full px-4 py-3 flex items-center justify-between text-left"
            onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
            aria-expanded={openCat === cat.id}
          >
            <span className="text-white/80 text-sm font-bold">{cat.emoji} {cat.title}
              <span className="text-white/25 font-normal"> · {cat.items.length}</span>
            </span>
            <ChevronDownIcon className={`w-4 h-4 text-white/30 transition-transform ${openCat === cat.id ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {openCat === cat.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-4 pb-3 space-y-2">
                  <p className="text-white/30 text-[11px] italic">{cat.blurb}</p>
                  {cat.items.map((item) => {
                    const added = inList(item.name);
                    return (
                      <div key={item.name} className="rounded-xl bg-white/3 border border-white/6 p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white/85 text-sm font-bold">{item.name}</p>
                            <p dir="rtl" lang="ar" className="text-brand-emerald/80 font-serif text-base leading-relaxed mt-0.5">{item.arabic}</p>
                            <p className="text-white/40 text-[11px] mt-1 leading-relaxed">{item.meaning}</p>
                            {item.virtue && <p className="text-brand-gold/60 text-[11px] mt-1 leading-relaxed">✨ {item.virtue}</p>}
                            <a className="text-white/30 text-[10px] underline" href={item.sourceUrl} target="_blank" rel="noreferrer">
                              {item.source}{item.grade ? ` · ${item.grade}` : ''}
                            </a>
                          </div>
                          <button
                            className={`btn btn-xs rounded-lg shrink-0 ${added ? 'bg-brand-emerald/15 border-brand-emerald/30 text-brand-emerald cursor-default' : 'bg-white/5 border-white/15 text-white/70 hover:border-brand-emerald/50'}`}
                            disabled={added || adding === item.name}
                            onClick={() => addFromLibrary(item)}
                          >
                            {added ? '✓ In your list' : adding === item.name ? '…' : '＋ Add'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* custom add */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <p className="text-white/60 text-xs font-bold mb-2">➕ Add your own zikr</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Rabbi zidni ilma"
            aria-label="Custom zikr name"
            className="input input-sm flex-1 bg-white/5 border-white/10 text-white rounded-xl"
            value={customName}
            maxLength={100}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }}
          />
          <button className="btn btn-sm rounded-xl border-0 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500"
            disabled={!customName.trim() || !!adding} onClick={addCustom}>Add</button>
        </div>
      </div>
    </div>
  );
}
