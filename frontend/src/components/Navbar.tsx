import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { signOut } from 'firebase/auth';
import logo from '../assets/logo.svg';
import { useAuthStore } from '../store/useAuthStore.js';
import { useZikrStore } from '../store/useZikrStore.js';
import { useAnalytics } from '../hooks/useAnalytics.js';
import { useSalatLog } from '../hooks/useSalatLog.js';
import { PRAYER_META } from '../utils/prayerTimes.js';
import {
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  ArrowLeftIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

// ── Page metadata ─────────────────────────────────────────────────────────────
const PAGE_META: Record<string, { title: string; emoji: string }> = {
  '/zikr':            { title: 'Zikr Counter',   emoji: '📿' },
  '/zikr/analytics':  { title: 'Zikr Analytics', emoji: '📊' },
  '/salat':           { title: 'Salat Tracker',   emoji: '🕌' },
  '/salat/analytics': { title: 'Salat Analytics', emoji: '📊' },
  '/fasting':         { title: 'Fasting',         emoji: '🌙' },
  '/prayer-times':    { title: 'Prayer Times',    emoji: '🕐' },
  '/quran':           { title: 'Quran Habit',     emoji: '📖' },
  '/settings':        { title: 'Settings',        emoji: '⚙️'  },
  '/profile':         { title: 'My Profile',      emoji: '👤' },
};

// ── Typewriter greeting ───────────────────────────────────────────────────────
function TextType({ text, speed = 55 }: { text: string; speed?: number }) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplay('');
    const id = setInterval(() => {
      setDisplay(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <span
      style={{
        backgroundImage: 'linear-gradient(90deg,var(--brand-emerald,#10b981) 0%,var(--brand-gold,#f59e0b) 50%,var(--brand-magenta,#c026d3) 100%)',
        backgroundSize: '200% 100%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        animation: 'navbarShimmer 10s linear infinite',
      }}
    >
      {display}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Navbar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, setUser } = useAuthStore();
  const { reset, counts, pending } = useZikrStore();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHome   = location.pathname === '/';
  const pageMeta = PAGE_META[location.pathname];

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  useEffect(() => { setDropdownOpen(false); }, [location.pathname]);

  // ── Context data (always called — React Query's enabled guards auth) ────────
  const { data: analyticsData } = useAnalytics(1);
  const { data: salatLog }      = useSalatLog();

  const streak        = analyticsData?.streak?.currentStreak ?? null;
  const dailyGoal     = analyticsData?.goal?.dailyTarget ?? null;
  const localTotal    = Object.values(counts ?? {}).reduce((a, b) => a + b, 0);
  const pendingTotal  = Object.values(pending ?? {}).reduce((a, b) => a + b, 0);
  const confirmedTotal = analyticsData?.today?.total ?? 0;
  const effectiveTotal = Math.max(localTotal, confirmedTotal + pendingTotal);
  const goalPct  = dailyGoal ? Math.min(100, Math.round((effectiveTotal / dailyGoal) * 100)) : null;
  const goalMet  = dailyGoal !== null && effectiveTotal >= dailyGoal;

  const salatCount = PRAYER_META.filter((p) => p.isTrackable).filter((p) => {
    const s = salatLog?.prayers[p.id as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha']?.status;
    return s === 'completed' || s === 'kaza';
  }).length;

  const firstName = user?.displayName?.split(' ')[0] ?? '';
  const greeting  = `Assalamu 'alaikum${firstName ? ', ' + firstName : ''}`;

  const toggleTheme = () => {
    const theme = document.documentElement.getAttribute('data-theme') ?? 'ihsan';
    const next = theme === 'ihsan' ? 'light' : 'ihsan';
    localStorage.setItem('ihsan_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // ── Center content by route ───────────────────────────────────────────────
  const centerContent = (() => {
    if (isHome && user) {
      return (
        <div className="hidden sm:block truncate text-sm font-bold">
          <TextType text={greeting} speed={50} />
        </div>
      );
    }
    if (location.pathname === '/zikr') {
      return (
        <div className="flex items-center gap-1.5">
          {streak !== null && (
            <div className="tooltip tooltip-bottom" data-tip={`${streak} day streak`}>
              <span className="px-2 py-0.5 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-white text-xs font-bold flex items-center gap-1">
                🔥 {streak}
              </span>
            </div>
          )}
          {goalPct !== null && (
            <div className="tooltip tooltip-bottom" data-tip={goalMet ? 'Daily goal achieved! 🏆' : `${effectiveTotal}/${dailyGoal} today`}>
              <span className={`px-2 py-0.5 rounded-full border text-white text-xs font-bold flex items-center gap-1 ${goalMet ? 'bg-brand-emerald/25 border-brand-emerald/50' : 'bg-white/10 border-white/20'}`}>
                {goalMet ? '✅' : '🎯'} {goalPct}%
              </span>
            </div>
          )}
          <Link
            to="/zikr/analytics"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-emerald/15 hover:bg-brand-emerald/25 border border-brand-emerald/40 hover:border-brand-emerald/70 text-brand-emerald hover:text-white transition-all text-xs font-bold"
          >
            <ChartBarIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Zikr Analytics</span>
          </Link>
        </div>
      );
    }
    if (location.pathname === '/salat') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-white text-xs font-bold whitespace-nowrap">
            🕌 {salatCount}/5 today
          </span>
          <Link
            to="/salat/analytics"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-emerald/15 hover:bg-brand-emerald/25 border border-brand-emerald/40 hover:border-brand-emerald/70 text-brand-emerald hover:text-white transition-all text-xs font-bold"
          >
            <ChartBarIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Prayer Analytics</span>
          </Link>
        </div>
      );
    }
    return null;
  })();

  return (
    <>
      <nav className="sticky top-0 z-40 bg-gradient-to-r from-[#0a1a0d] via-brand-deep to-[#0d1520] border-b border-brand-emerald/20 shadow-[0_2px_16px_rgba(16,185,129,0.08)]">
        <div className="flex items-center h-14 px-3 sm:px-4 gap-2">

          {/* ── Left: logo + back + title ─────────────────── */}
          <div className="flex items-center gap-0.5 flex-shrink-0 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-white/8 transition-all group"
            >
              <img src={logo as string} alt="Ihsan" className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold text-white text-sm hidden sm:inline group-hover:text-brand-emerald transition-colors">Ihsan</span>
            </Link>

            {!isHome && (
              <div className="flex items-center gap-0.5 min-w-0">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all text-xs font-medium flex-shrink-0"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Back</span>
                </button>

                {pageMeta && (
                  <div className="flex items-center gap-1 min-w-0 pl-1">
                    <span className="text-white/15 text-sm hidden sm:inline">|</span>
                    <span className="text-sm shrink-0" aria-hidden>{pageMeta.emoji}</span>
                    <span className="font-semibold text-white/70 text-xs sm:text-sm truncate max-w-[70px] sm:max-w-[130px]">
                      {pageMeta.title}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Center ────────────────────────────────────── */}
          <div className="flex-1 flex justify-center items-center overflow-hidden px-1">
            {centerContent}
            {isHome && user && (
              <div className="sm:hidden min-w-0 overflow-hidden">
                <span
                  className="text-xs font-bold truncate block"
                  style={{
                    backgroundImage: 'linear-gradient(90deg,var(--brand-emerald,#10b981) 0%,var(--brand-gold,#f59e0b) 50%,var(--brand-magenta,#c026d3) 100%)',
                    backgroundSize: '200% 100%',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    animation: 'navbarShimmer 10s linear infinite',
                  }}
                >
                  {greeting}
                </span>
              </div>
            )}
          </div>

          {/* ── Right: settings + theme + profile ─────────── */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {user && (
              <Link
                to="/settings"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all text-xs font-medium"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all"
              title="Toggle theme"
            >
              <MoonIcon className="w-4 h-4" />
            </button>

            {user ? (
              <div className="relative ml-0.5" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ring-2 ${dropdownOpen ? 'ring-brand-emerald scale-105' : 'ring-brand-emerald/30 hover:ring-brand-emerald/70'}`}
                >
                  {user.photoUrl ? (
                    <img alt="Profile" src={user.photoUrl} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-emerald/30 flex items-center justify-center">
                      <span className="text-xs font-black text-white">
                        {user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
                      </span>
                    </div>
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-brand-deep border border-brand-border rounded-2xl z-50 w-64 shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-brand-border/60 bg-brand-surface/60">
                      <div className="flex items-center gap-3">
                        {user.photoUrl ? (
                          <img src={user.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-emerald/40 flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-brand-emerald/20 ring-2 ring-brand-emerald/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-black text-brand-emerald">
                              {user.displayName?.[0]?.toUpperCase() ?? 'U'}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-bold text-sm truncate leading-snug">{user.displayName ?? 'User'}</p>
                          <p className="text-white/30 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/6 text-sm transition-colors"
                      >
                        <UserCircleIcon className="w-4 h-4 text-brand-emerald/70" />
                        Edit Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/6 text-sm transition-colors"
                      >
                        <Cog6ToothIcon className="w-4 h-4 text-white/40" />
                        Settings
                      </Link>

                      <div className="border-t border-brand-border/60 mt-1 pt-1">
                        <button
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm transition-colors"
                          onClick={() => { setDropdownOpen(false); setConfirmLogout(true); }}
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-1 px-3 py-1.5 rounded-xl bg-brand-emerald hover:bg-brand-emerald-dim text-white text-xs font-semibold transition-all shadow-md"
                onClick={() => sessionStorage.setItem('ihsan_redirect', location.pathname)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Sign out confirmation ─────────────────────────────────────────── */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card bg-brand-surface border border-brand-border shadow-2xl w-full max-w-sm">
            <div className="card-body gap-4 p-6">
              <h3 className="text-lg font-black text-brand-emerald">Sign Out?</h3>
              <p className="text-sm text-white/60">Are you sure? Any unsynced counts will be lost.</p>
              <div className="flex gap-3 justify-end">
                <button className="btn btn-ghost btn-sm text-white/60" onClick={() => setConfirmLogout(false)}>Cancel</button>
                <button
                  className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-0"
                  onClick={async () => {
                    await signOut(auth);
                    setUser(null);
                    localStorage.removeItem('ihsan_user');
                    localStorage.removeItem('ihsan_idToken');
                    sessionStorage.removeItem('ihsan_redirect');
                    reset();
                    setConfirmLogout(false);
                    navigate('/', { replace: true });
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
