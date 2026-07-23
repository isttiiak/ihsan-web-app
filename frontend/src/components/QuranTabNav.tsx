import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cog6ToothIcon, Bars3Icon, CheckIcon } from '@heroicons/react/24/outline';
import QuranSettings from './QuranSettings.js';

/**
 * The Quran section's six rooms + the settings drawer, available on EVERY
 * Quran page (Istiak's spec).
 *
 * RESPONSIVE (Istiak): six pills never fit a phone — they squashed and broke.
 * On small screens this collapses into a single MENU button showing the current
 * room, which opens a sheet listing every room plus Settings. From `sm` up the
 * familiar pill row returns (scrollable, never squashed).
 */
const TABS = [
  { id: 'home', label: '📖 Quran', to: '/quran' },
  { id: 'khatam', label: '🕋 Khatam', to: '/quran/khatam' },
  { id: 'read', label: '🧭 Read', to: '/quran/browse' },
  { id: 'listen', label: '🎧 Listen', to: '/quran/listen' },
  { id: 'bookmarks', label: '🔖 Saved', to: '/quran/bookmarks' },
  { id: 'analytics', label: '📊 Analytics', to: '/quran/analytics' },
] as const;

export type QuranTab = (typeof TABS)[number]['id'];

export default function QuranTabNav({ active }: { active: QuranTab }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeTab = TABS.find((t) => t.id === active) ?? TABS[0];

  // Close the sheet on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="relative">
      {/* ── Mobile: one menu button ── */}
      <div className="sm:hidden flex items-center gap-2">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex-1 flex items-center justify-between gap-2 rounded-xl bg-white/5 border border-emerald-500/12 px-3.5 py-2.5 text-white font-bold text-sm"
        >
          <span className="truncate">{activeTab.label}</span>
          <Bars3Icon className="w-5 h-5 text-white/50 shrink-0" />
        </button>
      </div>

      {/* ── sm and up: the pill row ── */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="flex-1 flex gap-1 bg-white/5 rounded-xl p-1 border border-emerald-500/10 overflow-x-auto">
          {TABS.map((t) =>
            t.id === active ? (
              <span key={t.id} aria-current="page"
                className="shrink-0 text-center text-xs font-bold py-1.5 rounded-lg bg-white/10 text-white whitespace-nowrap px-3">
                {t.label}
              </span>
            ) : (
              <Link key={t.id} to={t.to}
                className="shrink-0 text-center text-xs font-semibold py-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all whitespace-nowrap px-3">
                {t.label}
              </Link>
            )
          )}
        </div>
        <button
          aria-label="Quran settings"
          className="p-2 rounded-xl bg-white/5 border border-emerald-500/10 text-white/50 hover:text-white shrink-0"
          onClick={() => setSettingsOpen(true)}
        ><Cog6ToothIcon className="w-4 h-4" /></button>
      </div>

      {/* ── Mobile menu sheet ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="sm:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              role="menu"
              className="sm:hidden absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-emerald-500/15 bg-brand-deep shadow-2xl overflow-hidden"
            >
              {TABS.map((t) => (
                <Link
                  key={t.id}
                  to={t.to}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 text-sm border-b border-emerald-500/8 last:border-0 transition-colors ${
                    t.id === active ? 'bg-brand-emerald/12 text-brand-emerald font-bold' : 'text-white/70 active:bg-white/5'
                  }`}
                >
                  <span>{t.label}</span>
                  {t.id === active && <CheckIcon className="w-4 h-4" />}
                </Link>
              ))}
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white/70 active:bg-white/5 border-t border-emerald-500/12"
              >
                <Cog6ToothIcon className="w-4 h-4 text-white/50" />
                Quran settings
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <QuranSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
