import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import QuranSettings from './QuranSettings.js';

/**
 * The Quran section's six rooms + the settings drawer, available on EVERY
 * Quran page (Istiak's spec). Same pill styling as the shared TabNav but
 * wider + horizontally scrollable.
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
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex gap-1 bg-white/5 rounded-xl p-1 border border-slate-400/10 overflow-x-auto">
        {TABS.map((t) =>
          t.id === active ? (
            <span key={t.id} aria-current="page"
              className="flex-1 text-center text-xs font-bold py-1.5 rounded-lg bg-white/10 text-white whitespace-nowrap px-2.5">
              {t.label}
            </span>
          ) : (
            <Link key={t.id} to={t.to}
              className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all whitespace-nowrap px-2.5">
              {t.label}
            </Link>
          )
        )}
      </div>
      <button
        aria-label="Quran settings"
        className="p-2 rounded-xl bg-white/5 border border-slate-400/10 text-white/50 hover:text-white shrink-0"
        onClick={() => setSettingsOpen(true)}
      ><Cog6ToothIcon className="w-4 h-4" /></button>
      <QuranSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
