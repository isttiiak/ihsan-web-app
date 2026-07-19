import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useZikrStore } from '../store/useZikrStore.js';
import { useAddZikrType, useDeleteZikrType, useZikrTypes } from '../hooks/useZikrTypes.js';
import { ZIKR_LIBRARY } from '../utils/zikrLibrary.js';
import ConfirmDialog from './ConfirmDialog.js';

/**
 * 📿 The zikr library (Istiak's plan) — a curated, categorized, hadith-
 * verified collection in Settings. Users add what they want to their OWN
 * counter list; the database defaults stay untouched. Custom adhkār can be
 * added here too.
 */
/** Every name that belongs to the curated catalog — used to tell a
 * user-typed "custom" zikr apart from a library-added one. */
const LIBRARY_NAMES = new Set(
  ZIKR_LIBRARY.flatMap((c) => c.items.map((i) => i.name.toLowerCase()))
);

export default function ZikrLibrarySection() {
  const { types, setTypes, setCustomMeaning, removeType } = useZikrStore();
  const addZikrType = useAddZikrType();
  const deleteZikrType = useDeleteZikrType();
  const { data: fetchedTypes } = useZikrTypes();
  const [openCat, setOpenCat] = useState<string | null>('salawat');
  const [customName, setCustomName] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const inList = (name: string) => types.some((t) => t.toLowerCase() === name.toLowerCase());

  // "Custom" = server-stored types the user typed themselves (not in the
  // curated catalog). Only these are deletable here (Istiak's spec).
  const customTypes = useMemo(
    () => (fetchedTypes ?? [])
      .map((t) => t.name)
      .filter((n): n is string => !!n && !LIBRARY_NAMES.has(n.toLowerCase())),
    [fetchedTypes]
  );

  const deleteCustom = (name: string) => {
    removeType(name);
    deleteZikrType.mutate(name, {
      onError: () => toast.error('Could not remove — try again.', { id: 'lib-del' }),
    });
    toast.success(`"${name}" removed`, { id: 'lib-del', icon: '🗑️' });
    setConfirmDelete(null);
  };

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
        <div key={cat.id} className="rounded-2xl border border-slate-400/8 bg-white/3 overflow-hidden">
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
                      <div key={item.name} className="rounded-xl bg-white/3 border border-slate-400/6 p-3">
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
                            className={`btn btn-xs rounded-lg shrink-0 ${added ? 'bg-brand-emerald/15 border-brand-emerald/30 text-brand-emerald cursor-default' : 'bg-white/5 border-slate-400/15 text-white/70 hover:border-brand-emerald/50'}`}
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
      <div className="rounded-2xl border border-slate-400/8 bg-white/3 p-4">
        <p className="text-white/60 text-xs font-bold mb-2">➕ Add your own zikr</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Rabbi zidni ilma"
            aria-label="Custom zikr name"
            className="input input-sm flex-1 bg-white/5 border-slate-400/10 text-white rounded-xl"
            value={customName}
            maxLength={100}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }}
          />
          <button className="btn btn-sm rounded-xl border-0 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500"
            disabled={!customName.trim() || !!adding} onClick={addCustom}>Add</button>
        </div>

        {/* Your custom additions — only these can be deleted from the library */}
        {customTypes.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-white/40 text-[11px] font-bold">Your custom additions</p>
            {customTypes.map((name) => (
              <div key={name} className="flex items-center gap-2 rounded-xl bg-white/3 border border-slate-400/10 px-3 py-2">
                <span className="flex-1 min-w-0 truncate text-white/75 text-xs">{name}</span>
                <button
                  onClick={() => setConfirmDelete(name)}
                  aria-label={`Delete ${name}`}
                  className="btn btn-xs btn-ghost text-red-400/60 hover:text-red-400 hover:bg-red-500/10 gap-1 shrink-0"
                >
                  <TrashIcon className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete "${confirmDelete ?? ''}"?`}
        message="This removes your custom zikr from the list and the server. Curated library items can't be deleted — only added or left out."
        confirmLabel="Yes, delete"
        onConfirm={() => confirmDelete && deleteCustom(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
