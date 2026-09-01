import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronDownIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useZikrStore } from '../store/useZikrStore.js';
import { useAddZikrType, useDeleteZikrType, useZikrTypes } from '../hooks/useZikrTypes.js';
import { ZIKR_LIBRARY, PREDEFINED_TYPES, LEGACY_LIBRARY_NAMES, zikrDisplayName, type LibraryZikr } from '../utils/zikrLibrary.js';
import { formatLocaleNumber } from '../utils/localeDate.js';
import { translateReference } from '../utils/localeReference.js';
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
  const { t, i18n } = useTranslation();
  const { types, setTypes, setCustomMeaning, removeType } = useZikrStore();
  const addZikrType = useAddZikrType();
  const deleteZikrType = useDeleteZikrType();
  const { data: fetchedTypes } = useZikrTypes();
  // Start fully collapsed — pre-opening 'salawat' made the section land
  // half-scrolled with one category already sprawling.
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editZikr, setEditZikr] = useState<string | null>(null);

  // Custom-add form — same fields as the counter's add modal
  const [customName, setCustomName] = useState('');
  const [customArabic, setCustomArabic] = useState('');
  const [customMeaningText, setCustomMeaningText] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [customSourceUrl, setCustomSourceUrl] = useState('');

  const inList = (name: string) => types.some((n) => n.toLowerCase() === name.toLowerCase());

  // "Custom" = server-stored types the user typed themselves — NOT the
  // counter's predefined defaults and NOT curated library items.
  const customTypes = useMemo(
    () => (fetchedTypes ?? [])
      .map((ft) => ft.name)
      .filter((n): n is string => !!n && !APP_OWNED_NAMES.has(n.toLowerCase())),
    [fetchedTypes]
  );

  const deleteCustom = (name: string) => {
    removeType(name);
    deleteZikrType.mutate(name, {
      onError: () => toast.error(t('zikrLibrary.removeFail', 'Could not remove — try again.'), { id: 'lib-del' }),
    });
    toast.success(t('zikrLibrary.removed', '"{{name}}" removed', { name }), { id: 'lib-del', icon: '🗑️' });
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
        toast.success(t('zikrLibrary.added', '"{{name}}" added to your counter 📿', { name: zikrDisplayName(item.name, i18n.language) }), { id: 'lib-add' });
        setAdding(null);
      },
      onError: () => { toast.error(t('zikrLibrary.addFail', 'Could not add — try again.'), { id: 'lib-add' }); setAdding(null); },
    });
  };

  const addCustom = () => {
    const name = customName.trim();
    const meaningText = customMeaningText.trim();
    if (!name || !meaningText) return;
    if (name.includes('.') || name.startsWith('$')) { toast.error(t('zikrLibrary.invalidName', 'Name may not contain "." or start with "$"')); return; }
    if (inList(name)) { toast(t('zikrLibrary.alreadyInList', 'Already in your list ✓'), { id: 'lib-custom' }); return; }
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
        toast.success(t('zikrLibrary.customAdded', '"{{name}}" added 📿', { name }), { id: 'lib-custom' });
        setCustomName(''); setCustomArabic(''); setCustomMeaningText('');
        setCustomSource(''); setCustomSourceUrl('');
        setAdding(null);
      },
      onError: () => { toast.error(t('zikrLibrary.addFail', 'Could not add — try again.'), { id: 'lib-custom' }); setAdding(null); },
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-white/40 text-xs leading-relaxed">
        {t('zikrLibrary.intro', "Add any of these to your counter's dropdown — every reference is verified. Your existing list stays exactly as it is.")}
      </p>

      {ZIKR_LIBRARY.map((cat) => (
        <div key={cat.id} id={`zikr-cat-${cat.id}`} className="rounded-2xl border border-brand-emerald/10 bg-white/5 overflow-hidden">
          <button
            className="w-full px-4 py-3 flex items-center justify-between text-left"
            onClick={() => {
              const opening = openCat !== cat.id;
              setOpenCat(opening ? cat.id : null);
              // When another section collapses above, the page used to land at
              // the END of the newly expanded list — pin the header instead.
              if (opening) {
                setTimeout(() => {
                  document.getElementById(`zikr-cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 280);
              }
            }}
            aria-expanded={openCat === cat.id}
          >
            <span className="text-white/80 text-sm font-bold">{cat.emoji} {i18n.language === 'bn' && cat.titleBn ? cat.titleBn : cat.title}
              <span className="text-white/25 font-normal"> · {formatLocaleNumber(cat.items.length)}</span>
            </span>
            <ChevronDownIcon className={`w-4 h-4 text-white/30 transition-transform ${openCat === cat.id ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {openCat === cat.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-4 pb-3 space-y-2">
                  <p className="text-white/30 text-[11px] italic">{i18n.language === 'bn' && cat.blurbBn ? cat.blurbBn : cat.blurb}</p>
                  {cat.items.map((item) => {
                    const added = inList(item.name);
                    return (
                      <div key={item.name} className="rounded-xl bg-white/5 border border-brand-emerald/10 p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-sm font-bold">{zikrDisplayName(item.name, i18n.language)}</p>
                            <p dir="rtl" lang="ar" className="text-brand-emerald/80 font-serif text-base leading-loose mt-0.5">{item.arabic}</p>
                            <p className="text-white/40 text-[11px] mt-1 leading-relaxed">{i18n.language === 'bn' && item.meaningBn ? item.meaningBn : item.meaning}</p>
                            {item.virtue && <p className="text-brand-gold/60 text-[11px] mt-1 leading-relaxed">✨ {i18n.language === 'bn' && item.virtueBn ? item.virtueBn : item.virtue}</p>}
                            <a className="text-white/30 text-[10px] underline" href={item.sourceUrl} target="_blank" rel="noreferrer">
                              {translateReference(item.source, i18n.language)}{item.grade ? ` · ${translateReference(item.grade, i18n.language)}` : ''}
                            </a>
                          </div>
                          <button
                            className={`btn btn-xs rounded-lg shrink-0 ${added ? 'bg-brand-emerald border-brand-emerald text-white font-bold cursor-default !opacity-100' : 'bg-white/5 border-brand-emerald/20 text-white/70 hover:border-brand-emerald/50'}`}
                            disabled={added || adding === item.name}
                            onClick={() => addFromLibrary(item)}
                          >
                            {added ? t('zikrLibrary.inList', '✓ In your list') : adding === item.name ? '…' : t('zikrLibrary.addToList', '＋ Add to list')}
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
      <div className="rounded-2xl border border-brand-emerald/10 bg-white/5 p-4">
        <p className="text-white/60 text-xs font-bold mb-1">{t('zikrLibrary.addOwn', '➕ Add your own zikr')}</p>
        <p className="text-white/30 text-[11px] mb-3">{t('zikrLibrary.addOwnHint', 'Name and meaning are required — Arabic and a reference make it complete.')}</p>
        <div className="space-y-2">
          <input
            type="text"
            placeholder={t('zikrLibrary.namePlaceholder', 'Name — e.g. Rabbi zidni ilma *')}
            aria-label={t('zikrLibrary.nameLabel', 'Custom zikr name')}
            className="input input-sm w-full bg-white/5 border-brand-emerald/15 text-white rounded-xl"
            value={customName}
            maxLength={100}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <input
            type="text"
            dir="rtl"
            placeholder={t('zikrLibrary.arabicPlaceholder', 'Arabic — رَبِّ زِدْنِي عِلْمًا')}
            aria-label={t('zikrLibrary.arabicLabel', 'Custom zikr Arabic text')}
            className="input input-sm w-full bg-white/5 border-brand-emerald/15 text-white rounded-xl font-serif"
            value={customArabic}
            onChange={(e) => setCustomArabic(e.target.value)}
          />
          <input
            type="text"
            placeholder={t('zikrLibrary.meaningPlaceholder', 'Meaning — e.g. My Lord, increase me in knowledge *')}
            aria-label={t('zikrLibrary.meaningLabel', 'Custom zikr meaning')}
            className="input input-sm w-full bg-white/5 border-brand-emerald/15 text-white rounded-xl"
            value={customMeaningText}
            onChange={(e) => setCustomMeaningText(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder={t('zikrLibrary.refPlaceholder', 'Reference — e.g. Quran 20:114')}
              aria-label={t('zikrLibrary.refLabel', 'Custom zikr reference')}
              className="input input-sm w-full bg-white/5 border-brand-emerald/15 text-white rounded-xl text-xs"
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
            />
            <input
              type="text"
              placeholder={t('zikrLibrary.linkPlaceholder', 'Link — https://quran.com/20/114')}
              aria-label={t('zikrLibrary.linkLabel', 'Custom zikr reference link')}
              className="input input-sm w-full bg-white/5 border-brand-emerald/15 text-white rounded-xl text-xs"
              value={customSourceUrl}
              onChange={(e) => setCustomSourceUrl(e.target.value)}
            />
          </div>
          <button className="btn btn-sm w-full rounded-xl border-0 text-white font-bold bg-gradient-to-r from-brand-emerald to-brand-info"
            disabled={!customName.trim() || !customMeaningText.trim() || !!adding} onClick={addCustom}>{t('zikrLibrary.addToCounter', 'Add to my counter')}</button>
        </div>

        {/* Your custom additions — editable (incl. rename) and deletable */}
        {customTypes.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-white/40 text-[11px] font-bold">{t('zikrLibrary.customAdditions', 'Your custom additions')}</p>
            {customTypes.map((name) => (
              <div key={name} className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-brand-emerald/10 px-3 py-2">
                <span className="flex-1 min-w-0 truncate text-white/75 text-xs">{name}</span>
                <button
                  onClick={() => setEditZikr(name)}
                  aria-label={t('zikrLibrary.editAria', 'Edit {{name}}', { name })}
                  className="btn btn-xs btn-ghost text-brand-emerald/70 hover:text-brand-emerald hover:bg-brand-emerald/10 gap-1 shrink-0"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" /> {t('zikrLibrary.edit', 'Edit')}
                </button>
                <button
                  onClick={() => setConfirmDelete(name)}
                  aria-label={t('zikrLibrary.deleteAria', 'Delete {{name}}', { name })}
                  className="btn btn-xs btn-ghost text-red-400/60 hover:text-red-400 hover:bg-red-500/10 gap-1 shrink-0"
                >
                  <TrashIcon className="w-3.5 h-3.5" /> {t('zikrLibrary.delete', 'Delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title={t('zikrLibrary.deleteConfirmTitle', 'Delete "{{name}}"?', { name: confirmDelete ?? '' })}
        message={t('zikrLibrary.deleteConfirmMsg', "This removes your custom zikr from the list and the server. Curated library items can't be deleted — only added or left out.")}
        confirmLabel={t('zikrLibrary.yesDelete', 'Yes, delete')}
        onConfirm={() => confirmDelete && deleteCustom(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <EditZikrModal name={editZikr} onClose={() => setEditZikr(null)} />
    </div>
  );
}
