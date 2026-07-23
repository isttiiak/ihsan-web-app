import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronDownIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useZikrStore } from '../store/useZikrStore.js';
import { useAddZikrType, useDeleteZikrType, useZikrTypes } from '../hooks/useZikrTypes.js';
import { ZIKR_LIBRARY, PREDEFINED_TYPES, LEGACY_LIBRARY_NAMES, type LibraryZikr } from '../utils/zikrLibrary.js';
import ConfirmDialog from './ConfirmDialog.js';
import EditZikrModal from './EditZikrModal.js';

/**
 * 📿 The zikr library (Istiak's plan) — a curated, categorized, hadith-
 * verified collection in Settings. Users add what they want to their OWN
 * counter list; the database defaults stay untouched. Custom adhkār get the
 * same full form as the counter's add modal (arabic/meaning/reference) and
 * can be edited afterwards — including renaming.
 */

/** Names that belong to the app (curated catalog + counter predefined +
 * legacy renamed entries) — everything else on the server is user-custom. */
const APP_OWNED_NAMES = new Set(
  [
    ...ZIKR_LIBRARY.flatMap((c) => c.items.map((i) => i.name)),
    ...PREDEFINED_TYPES,
    ...LEGACY_LIBRARY_NAMES,
  ].map((n) => n.toLowerCase())
);

export default function ZikrLibrarySection() {
  const { types, setTypes, setCustomMeaning, removeType } = useZikrStore();
  const addZikrType = useAddZikrType();
  const deleteZikrType = useDeleteZikrType();
  const { data: fetchedTypes } = useZikrTypes();
  const [openCat, setOpenCat] = useState<string | null>('salawat');
  const [adding, setAdding] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editZikr, setEditZikr] = useState<string | null>(null);

  // Custom-add form — same fields as the counter's add modal
  const [customName, setCustomName] = useState('');
  const [customArabic, setCustomArabic] = useState('');
  const [customMeaningText, setCustomMeaningText] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [customSourceUrl, setCustomSourceUrl] = useState('');

  const inList = (name: string) => types.some((t) => t.toLowerCase() === name.toLowerCase());

  // "Custom" = server-stored types the user typed themselves — NOT the
  // counter's predefined defaults and NOT curated library items.
  const customTypes = useMemo(
    () => (fetchedTypes ?? [])
      .map((t) => t.name)
      .filter((n): n is string => !!n && !APP_OWNED_NAMES.has(n.toLowerCase())),
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

  const addFromLibrary = (item: LibraryZikr) => {
    if (inList(item.name)) return;
    setAdding(item.name);
    addZikrType.mutate(item.name, {
      onSuccess: () => {
        setTypes([...types, item.name]);
        setCustomMeaning(item.name, {
          arabic: item.shortArabic ?? item.arabic,
          meaning: item.shortMeaning ?? item.meaning,
          fullArabic: item.arabic,
          fullMeaning: item.meaning,
          source: item.source,
          sourceUrl: item.sourceUrl,
          grade: item.grade,
          virtue: item.virtue,
        });
        toast.success(`"${item.name}" added to your counter 📿`, { id: 'lib-add' });
        setAdding(null);
      },
      onError: () => { toast.error('Could not add — try again.', { id: 'lib-add' }); setAdding(null); },
    });
  };

  const addCustom = () => {
    const name = customName.trim();
    const meaningText = customMeaningText.trim();
    if (!name || !meaningText) return;
    if (name.includes('.') || name.startsWith('$')) { toast.error('Name may not contain "." or start with "$"'); return; }
    if (inList(name)) { toast('Already in your list ✓', { id: 'lib-custom' }); return; }
    setAdding(name);
    addZikrType.mutate(name, {
      onSuccess: () => {
        setTypes([...types, name]);
        setCustomMeaning(name, {
          arabic: customArabic.trim() || undefined,
          meaning: meaningText,
          source: customSource.trim() || undefined,
          sourceUrl: customSourceUrl.trim() || undefined,
        });
        toast.success(`"${name}" added 📿`, { id: 'lib-custom' });
        setCustomName(''); setCustomArabic(''); setCustomMeaningText('');
        setCustomSource(''); setCustomSourceUrl('');
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
        <div key={cat.id} className="rounded-2xl border border-emerald-500/10 bg-white/3 overflow-hidden">
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
                      <div key={item.name} className="rounded-xl bg-white/3 border border-emerald-500/8 p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white/85 text-sm font-bold">{item.name}</p>
                            <p dir="rtl" lang="ar" className="text-brand-emerald/80 font-serif text-base leading-loose mt-0.5">{item.arabic}</p>
                            <p className="text-white/40 text-[11px] mt-1 leading-relaxed">{item.meaning}</p>
                            {item.virtue && <p className="text-brand-gold/60 text-[11px] mt-1 leading-relaxed">✨ {item.virtue}</p>}
                            <a className="text-white/30 text-[10px] underline" href={item.sourceUrl} target="_blank" rel="noreferrer">
                              {item.source}{item.grade ? ` · ${item.grade}` : ''}
                            </a>
                          </div>
                          <button
                            className={`btn btn-xs rounded-lg shrink-0 ${added ? 'bg-brand-emerald/15 border-brand-emerald/30 text-brand-emerald cursor-default' : 'bg-white/5 border-emerald-500/20 text-white/70 hover:border-brand-emerald/50'}`}
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

      {/* custom add — full form, same fields as the counter's modal */}
      <div className="rounded-2xl border border-emerald-500/10 bg-white/3 p-4">
        <p className="text-white/60 text-xs font-bold mb-1">➕ Add your own zikr</p>
        <p className="text-white/30 text-[11px] mb-3">Name and meaning are required — Arabic and a reference make it complete.</p>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Name — e.g. Rabbi zidni ilma *"
            aria-label="Custom zikr name"
            className="input input-sm w-full bg-white/5 border-emerald-500/15 text-white rounded-xl"
            value={customName}
            maxLength={100}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <input
            type="text"
            dir="rtl"
            placeholder="Arabic — رَبِّ زِدْنِي عِلْمًا"
            aria-label="Custom zikr Arabic text"
            className="input input-sm w-full bg-white/5 border-emerald-500/15 text-white rounded-xl font-serif"
            value={customArabic}
            onChange={(e) => setCustomArabic(e.target.value)}
          />
          <input
            type="text"
            placeholder="Meaning — e.g. My Lord, increase me in knowledge *"
            aria-label="Custom zikr meaning"
            className="input input-sm w-full bg-white/5 border-emerald-500/15 text-white rounded-xl"
            value={customMeaningText}
            onChange={(e) => setCustomMeaningText(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Reference — e.g. Quran 20:114"
              aria-label="Custom zikr reference"
              className="input input-sm w-full bg-white/5 border-emerald-500/15 text-white rounded-xl text-xs"
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
            />
            <input
              type="text"
              placeholder="Link — https://quran.com/20/114"
              aria-label="Custom zikr reference link"
              className="input input-sm w-full bg-white/5 border-emerald-500/15 text-white rounded-xl text-xs"
              value={customSourceUrl}
              onChange={(e) => setCustomSourceUrl(e.target.value)}
            />
          </div>
          <button className="btn btn-sm w-full rounded-xl border-0 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500"
            disabled={!customName.trim() || !customMeaningText.trim() || !!adding} onClick={addCustom}>Add to my counter</button>
        </div>

        {/* Your custom additions — editable (incl. rename) and deletable */}
        {customTypes.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-white/40 text-[11px] font-bold">Your custom additions</p>
            {customTypes.map((name) => (
              <div key={name} className="flex items-center gap-1.5 rounded-xl bg-white/3 border border-emerald-500/10 px-3 py-2">
                <span className="flex-1 min-w-0 truncate text-white/75 text-xs">{name}</span>
                <button
                  onClick={() => setEditZikr(name)}
                  aria-label={`Edit ${name}`}
                  className="btn btn-xs btn-ghost text-brand-emerald/70 hover:text-brand-emerald hover:bg-brand-emerald/10 gap-1 shrink-0"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                </button>
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

      <EditZikrModal name={editZikr} onClose={() => setEditZikr(null)} />
    </div>
  );
}
