import { motion, AnimatePresence } from 'framer-motion';

/**
 * Small app-wide confirmation dialog — the SECOND "are you sure?" for every
 * destructive action (Istiak's rule: deleting any data always asks twice —
 * first the inline tap, then this dialog).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Yes, delete',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm grid place-items-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.94, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 8 }}
            transition={{ type: 'spring', damping: 24 }}
            className="w-full max-w-xs rounded-2xl bg-brand-deep border border-red-400/25 p-5 text-center"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="text-3xl mb-2">🗑️</div>
            <h3 className="text-white font-black text-base">{title}</h3>
            <p className="text-white/50 text-xs mt-1.5 leading-relaxed">{message}</p>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 btn btn-sm rounded-xl bg-white/5 border-white/10 text-white/70" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="flex-1 btn btn-sm rounded-xl border-0 text-white font-bold bg-red-500/80 hover:bg-red-500"
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
