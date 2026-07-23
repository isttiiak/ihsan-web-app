import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useZikrStore } from '../store/useZikrStore.js';
import { useRenameZikrType } from '../hooks/useZikrTypes.js';

/**
 * Edit a CUSTOM zikr — title (server rename carries lifetime + daily counts
 * over), Arabic, meaning and reference. Used from the counter's manage modal
 * and the Settings library. Curated/predefined entries are not editable.
 */
export default function EditZikrModal({ name, onClose }: { name: string | null; onClose: () => void }) {
  const { customMeanings, setCustomMeaning, renameType } = useZikrStore();
  const renameZikrType = useRenameZikrType();

  const [title, setTitle] = useState('');
  const [arabic, setArabic] = useState('');
  const [meaning, setMeaning] = useState('');
  const [source, setSource] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Prefill whenever a zikr is opened
  useEffect(() => {
    if (!name) return;
    const m = customMeanings[name];
    setTitle(name);
    setArabic(m?.arabic ?? '');
    setMeaning(m?.meaning ?? '');
    setSource(m?.source ?? '');
    setSourceUrl(m?.sourceUrl ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const save = async () => {
    if (!name || saving) return;
    const newName = title.trim();
    if (!newName) { toast.error('The title is required'); return; }
    if (newName.includes('.') || newName.startsWith('$')) {
      toast.error('Title may not contain "." or start with "$"');
      return;
    }
    setSaving(true);
    try {
      if (newName !== name) {
        // Server first — if the rename fails (409 duplicate etc.) nothing moves locally.
        await renameZikrType.mutateAsync({ oldName: name, newName });
        renameType(name, newName);
      }
      setCustomMeaning(newName, {
        arabic: arabic.trim() || undefined,
        meaning: meaning.trim() || newName,
        source: source.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
      });
      toast.success('Zikr updated ✏️', { id: 'zikr-edit' });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Could not save — try again.', { id: 'zikr-edit' });
    } finally {
      setSaving(false);
    }
  };

  // Portaled: page ancestors create stacking contexts that let the sticky
  // navbar float over in-tree modals.
  return createPortal(
    <AnimatePresence>
      {name && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-brand-surface rounded-3xl p-6 w-full max-w-md shadow-2xl border border-brand-border"
          >
            <h3 className="text-xl font-bold text-brand-emerald mb-1">Edit zikr</h3>
            <p className="text-white/40 text-xs mb-4">
              Renaming keeps every count you've made — lifetime totals and daily history move with it.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Title <span className="text-red-400">*</span></label>
                <input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)}
                  className="input input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-sm" />
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Arabic text</label>
                <input value={arabic} dir="rtl" onChange={(e) => setArabic(e.target.value)}
                  className="input input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-base"
                  style={{ fontFamily: "'Amiri', serif" }} />
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1 block">Meaning</label>
                <input value={meaning} onChange={(e) => setMeaning(e.target.value)}
                  className="input input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-sm" />
              </div>
              <div className="border-t border-brand-border/60 pt-3 space-y-2">
                <p className="text-white/30 text-[10px] uppercase tracking-wider">Reference <span className="normal-case text-white/20">(optional)</span></p>
                <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Ṣaḥīḥ Muslim 2702"
                  className="input input-sm input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-xs" />
                <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://sunnah.com/..."
                  className="input input-sm input-bordered w-full bg-brand-deep border-brand-border text-white focus:border-brand-emerald text-xs" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="btn flex-1 btn-ghost text-white/60 border-brand-border">Cancel</button>
              <button onClick={() => void save()} disabled={!title.trim() || saving}
                className="btn flex-1 bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 font-bold">
                {saving ? <span className="loading loading-spinner loading-sm" /> : 'Save'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
