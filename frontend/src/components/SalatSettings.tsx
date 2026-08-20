import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';
import ConfirmDialog from './ConfirmDialog.js';
import {
  TASBIH_MODES, getTasbihMode, setTasbihMode, type TasbihMode,
  ASR_MADHABS, getAsrMadhab, setAsrMadhab, type AsrMadhab,
  AYATUL_KURSI_REF,
} from '../utils/salatPrefs.js';

/**
 * Salat settings — a right-side DRAWER, same shape as QuranSettings.
 *
 * Two genuinely personal choices live here:
 *  1. WHICH after-ṣalāh tasbīḥ you pray, so the tracker credits the right
 *     counts to your dhikr when you tap the tasbīḥ tag.
 *  2. WHICH madhab's ʿAṣr timing you follow, which also moves the end of Ẓuhr.
 *
 * Both are stored locally (utils/salatPrefs.ts) — no server round-trip.
 */
export default function SalatSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [tasbih, setTasbih] = useState<TasbihMode>(() => getTasbihMode());
  const [madhab, setMadhab] = useState<AsrMadhab>(() => getAsrMadhab());
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      await api.post('/api/salat/reset', { today });
      queryClient.invalidateQueries({ queryKey: ['salat'] });
      toast.success('Salat tracking reset — your history is preserved', { icon: '🕌' });
      setConfirmReset(false);
      onClose();
    } catch {
      toast.error('Could not reset — try again');
    } finally {
      setResetting(false);
    }
  };

  const chooseTasbih = (m: TasbihMode) => {
    setTasbih(m);
    setTasbihMode(m);
    toast.success('Tasbīḥ counting updated', { icon: '📿', duration: 1800 });
  };

  const chooseMadhab = (m: AsrMadhab) => {
    setMadhab(m);
    setAsrMadhab(m);
    toast.success('Prayer times updated', { icon: '🕌', duration: 1800 });
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-sm bg-brand-deep border-l border-brand-border overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Salat settings"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-brand-deep/95 backdrop-blur border-b border-brand-emerald/10">
              <h2 className="text-brand-emerald font-black text-lg">Salat settings</h2>
              <button
                onClick={onClose}
                aria-label="Close salat settings"
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-7">

              {/* ── after-salah tasbih ─────────────────────────────────── */}
              <section>
                <h3 className="text-white font-bold text-sm">📿 After-ṣalāh tasbīḥ</h3>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">
                  Both ways of reaching a hundred are authentic. Pick the one you actually
                  pray — tapping “Tasbīḥ” on a prayer adds exactly these counts to your dhikr.
                </p>

                <div className="mt-3 space-y-2.5">
                  {TASBIH_MODES.map((m) => {
                    const active = tasbih === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => chooseTasbih(m.id)}
                        aria-pressed={active}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                          active
                            ? 'border-brand-emerald/40 bg-brand-emerald/10'
                            : 'border-brand-emerald/10 bg-white/5 hover:border-brand-emerald/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-black text-sm ${active ? 'text-brand-emerald' : 'text-white/80'}`}>
                            {m.label}
                          </span>
                          {active && <span className="text-brand-emerald text-xs font-bold shrink-0">✓ Using</span>}
                        </div>
                        <p className="text-white/50 text-xs mt-1">{m.summary}</p>

                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {m.steps.map((s) => (
                            <span
                              key={s.zikr}
                              className="px-2 py-0.5 rounded-lg bg-black/30 border border-brand-emerald/10 text-[11px] text-white/60"
                            >
                              {s.zikr.length > 18 ? 'Tahlīl' : s.zikr} <b className="text-white/80">×{s.count}</b>
                            </span>
                          ))}
                        </div>

                        {m.virtue && <p className="text-brand-gold/60 text-[11px] mt-2 italic">{m.virtue}</p>}
                        <a
                          href={m.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-block text-[11px] text-white/35 hover:text-brand-emerald mt-1.5 underline underline-offset-2"
                        >
                          {m.source} · {m.grade} ↗
                        </a>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── Ayatul Kursi note ──────────────────────────────────── */}
              <section className="p-3.5 rounded-2xl border border-brand-gold/20 bg-brand-gold/[0.06]">
                <h3 className="text-brand-gold font-bold text-sm">📖 Ayatul Kursi</h3>
                <p className="text-white/50 text-xs mt-1 leading-relaxed">
                  Tapping “Ayatul Kursi” on a prayer adds one count to that dhikr.
                </p>
                <p className="text-brand-gold/60 text-[11px] mt-2 italic">“{AYATUL_KURSI_REF.virtue}”</p>
                <p className="text-white/30 text-[11px] mt-1">
                  {AYATUL_KURSI_REF.source} · {AYATUL_KURSI_REF.grade}
                </p>
              </section>

              {/* ── Asr madhab ─────────────────────────────────────────── */}
              <section>
                <h3 className="text-white font-bold text-sm">🕌 ʿAṣr timing (madhab)</h3>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">
                  Madhabs differ on when ʿAṣr begins. Because Ẓuhr lasts until ʿAṣr starts,
                  this moves both. Follow your local mosque.
                </p>

                <div className="mt-3 space-y-2.5">
                  {ASR_MADHABS.map((m) => {
                    const active = madhab === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => chooseMadhab(m.id)}
                        aria-pressed={active}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                          active
                            ? 'border-brand-info/40 bg-brand-info/10'
                            : 'border-brand-emerald/10 bg-white/5 hover:border-brand-info/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-black text-sm ${active ? 'text-brand-info' : 'text-white/80'}`}>
                            {m.label}
                          </span>
                          {active && <span className="text-brand-info text-xs font-bold shrink-0">✓ Using</span>}
                        </div>
                        <p className="text-white/50 text-xs mt-1 leading-relaxed">{m.detail}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-white/25 text-[11px] mt-2.5 leading-relaxed">
                  Your saved location never leaves this device — prayer times are computed here.
                </p>
              </section>

              {/* ── Reset tracking ─────────────────────────────────── */}
              <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/[0.06] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowPathIcon className="w-4 h-4 text-brand-gold" />
                  <h3 className="text-brand-gold font-bold text-sm">Start fresh</h3>
                </div>
                <p className="text-white/40 text-xs leading-relaxed mb-3">
                  Analytics and streaks will count from today. All past prayer logs stay
                  intact — you can still view them, but they won't affect your new stats.
                </p>
                <button
                  onClick={() => setConfirmReset(true)}
                  className="btn btn-sm border border-brand-gold/30 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 gap-1.5"
                >
                  <ArrowPathIcon className="w-3.5 h-3.5" /> Reset tracking
                </button>
              </section>

              <p className="text-white/25 text-[11px] leading-relaxed border-t border-brand-emerald/10 pt-4">
                Looking for data deletion? Everything lives in{' '}
                <a href="/settings" className="text-brand-emerald/70 hover:text-brand-emerald underline underline-offset-2">
                  Settings
                </a>.
              </p>
            </div>
          </motion.aside>

          <ConfirmDialog
            open={confirmReset}
            title="Reset salat tracking?"
            message="Your streak and analytics will start fresh from today. All past prayer logs will be preserved — they just won't count toward the new stats."
            confirmLabel={resetting ? 'Resetting…' : 'Yes, start fresh'}
            onConfirm={() => void handleReset()}
            onCancel={() => setConfirmReset(false)}
          />
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
