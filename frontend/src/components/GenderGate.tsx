import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import api from '../lib/api.js';
import type { AuthUser } from '../types/api.js';

/**
 * Shown when a signed-in user has no gender set (Google-signup first login,
 * legacy accounts). Skippable — the user can choose later in Settings.
 *
 * For guest/demo users (no account), a lighter floating banner asks their
 * preference once and persists it in localStorage.
 */
export default function GenderGate() {
  const { user, setUser } = useAuthStore();
  const [selected, setSelected] = useState<'male' | 'female' | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [skipped, setSkipped] = useState(
    () => !!sessionStorage.getItem('ihsan_gender_skipped'),
  );

  const [guestDismissed, setGuestDismissed] = useState(
    () => !!localStorage.getItem('ihsan_guest_gender'),
  );

  // ── Authenticated user: skippable gate ─────────────────────────────────────
  if (user && !user.gender && !skipped) {
    const save = async () => {
      if (!selected) return;
      setSaving(true);
      setError('');
      try {
        await api.patch('/api/user/me', { gender: selected });
        const updated: AuthUser = { ...user, gender: selected };
        localStorage.setItem('ihsan_user', JSON.stringify(updated));
        setUser(updated);
      } catch {
        setError('Something went wrong. Please try again.');
        setSaving(false);
      }
    };

    const skip = () => {
      sessionStorage.setItem('ihsan_gender_skipped', '1');
      setSkipped(true);
    };

    return (
      <div className="fixed inset-0 z-[90] bg-brand-void/95 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="bg-brand-surface rounded-3xl border border-brand-border/60 shadow-2xl p-8 space-y-6 text-center">
            <div className="text-5xl">🌙</div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">As-salamu alaykum!</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                To personalise your experience — including content, greetings, and access to{' '}
                <span className="text-brand-emerald font-medium">Rayhanah</span> (cycle tracking for sisters) — please let us know:
              </p>
            </div>

            <div className="flex gap-3">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSelected(g)}
                  className={`flex-1 py-4 rounded-2xl text-sm font-bold border-2 transition-all ${
                    selected === g
                      ? 'bg-brand-emerald/20 border-brand-emerald text-brand-emerald scale-[1.02]'
                      : 'bg-white/5 border-brand-border text-white/50 hover:border-brand-border/80'
                  }`}
                >
                  <div className="text-2xl mb-1">{g === 'male' ? '🧔' : '🧕'}</div>
                  {g === 'male' ? 'Brother' : 'Sister'}
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={() => void save()}
              disabled={!selected || saving}
              className="w-full py-3 bg-brand-emerald hover:bg-brand-emerald-dim text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <span className="loading loading-spinner loading-sm" /> : 'Continue'}
            </button>

            <div className="border-t border-brand-border/40 pt-4 space-y-2">
              <button
                onClick={skip}
                className="text-white/40 hover:text-white/60 text-xs font-medium transition-colors"
              >
                I'll decide later
              </button>
              <p className="text-white/25 text-[11px] leading-relaxed">
                You can set this anytime in{' '}
                <Link to="/settings" onClick={skip} className="underline text-white/40 hover:text-white/60">
                  Settings
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Guest/demo user: lightweight floating banner ────────────────────────────
  if (!user && !guestDismissed) {
    const pickGuest = (g: 'male' | 'female') => {
      localStorage.setItem('ihsan_guest_gender', g);
      setGuestDismissed(true);
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.35 }}
          className="fixed bottom-4 left-4 right-4 z-[85] flex justify-center pointer-events-none"
        >
          <div className="bg-brand-surface/95 backdrop-blur-xl border border-brand-border/60 rounded-2xl shadow-2xl p-5 max-w-sm w-full pointer-events-auto space-y-3">
            <p className="text-white/70 text-sm font-semibold text-center">
              How would you like to explore?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => pickGuest('male')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-brand-border text-white/60 hover:bg-brand-emerald/10 hover:border-brand-emerald/40 hover:text-brand-emerald transition-all"
              >
                🧔 As a brother
              </button>
              <button
                onClick={() => pickGuest('female')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-brand-border text-white/60 hover:bg-brand-emerald/10 hover:border-brand-emerald/40 hover:text-brand-emerald transition-all"
              >
                🧕 As a sister
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}

/** Returns the active gender: authenticated user's gender, or the guest preference. */
export function getActiveGender(): 'male' | 'female' | undefined {
  const { user } = useAuthStore.getState();
  if (user?.gender === 'male' || user?.gender === 'female') return user.gender;
  const guest = localStorage.getItem('ihsan_guest_gender');
  if (guest === 'male' || guest === 'female') return guest;
  return undefined;
}
