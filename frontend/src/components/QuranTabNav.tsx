import { Link } from 'react-router-dom';

/**
 * The Quran section's five rooms (Istiak's spec). Same pill styling as the
 * shared TabNav but wider + horizontally scrollable — five tabs don't fit in
 * TabNav's max-w-xs.
 */
const TABS = [
  { id: 'home', label: '📖 Quran', to: '/quran' },
  { id: 'khatam', label: '🕋 Khatam', to: '/quran/khatam' },
  { id: 'read', label: '🧭 Read', to: '/quran/browse' },
  { id: 'listen', label: '🎧 Listen', to: '/quran/listen' },
  { id: 'analytics', label: '📊 Analytics', to: '/quran/analytics' },
] as const;

export type QuranTab = (typeof TABS)[number]['id'];

export default function QuranTabNav({ active }: { active: QuranTab }) {
  return (
    <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 overflow-x-auto">
      {TABS.map((t) =>
        t.id === active ? (
          <span key={t.id} aria-current="page"
            className="flex-1 text-center text-xs font-bold py-1.5 rounded-lg bg-white/10 text-white whitespace-nowrap px-3">
            {t.label}
          </span>
        ) : (
          <Link key={t.id} to={t.to}
            className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all whitespace-nowrap px-3">
            {t.label}
          </Link>
        )
      )}
    </div>
  );
}
