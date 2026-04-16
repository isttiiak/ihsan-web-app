import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { signOut } from 'firebase/auth';
import logo from '../assets/logo.svg';
import { useAuthStore } from '../store/useAuthStore.js';
import { useZikrStore } from '../store/useZikrStore.js';
import {
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';

interface TextTypeProps {
  text: string;
  speed?: number;
}

function TextType({ text, speed = 80 }: TextTypeProps) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplay('');
    const interval = setInterval(() => {
      setDisplay(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return (
    <span
      style={{
        backgroundImage: 'linear-gradient(90deg, var(--brand-emerald,#10b981) 0%, var(--brand-gold,#f59e0b) 50%, var(--brand-magenta,#c026d3) 100%)',
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

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { reset } = useZikrStore();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const salam = `Assalamu 'alaikum${user?.displayName ? ', ' + user.displayName.split(' ')[0] : ''}`;
  const focusRoutes = ['/zikr', '/salat', '/fasting', '/prayer-times'];
  const hideSalam = focusRoutes.includes(location.pathname);

  // Close dropdown on route change
  useEffect(() => { setDropdownOpen(false); }, [location.pathname]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeDropdown = () => setDropdownOpen(false);

  // Close on outside click
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

  const toggleTheme = () => {
    const theme = document.documentElement.getAttribute('data-theme') ?? 'ihsan';
    const next = theme === 'ihsan' ? 'light' : theme === 'light' ? 'ihsan' : 'ihsan';
    localStorage.setItem('ihsan_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <>
      <div className="navbar bg-gradient-to-r from-[#0a1a0d] via-brand-deep to-[#0d1520] text-white border-b border-brand-emerald/20 shadow-[0_2px_20px_rgba(16,185,129,0.12)] sticky top-0 z-40 px-2 sm:px-4">
        <div className="navbar-start flex-1">
          <Link to="/" className="btn btn-ghost text-lg sm:text-xl gap-2 hover:bg-white/10">
            <img src={logo as string} alt="Ihsan" className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="font-bold hidden sm:inline">Ihsan</span>
          </Link>
        </div>

        {user && !hideSalam && (
          <div className="navbar-center hidden md:flex flex-1 justify-center">
            <div className="text-center px-4">
              <TextType text={salam} speed={60} />
            </div>
          </div>
        )}

        <div className="navbar-end flex-none gap-2">
          <div className="hidden lg:flex gap-1">
            {user && (
              <Link
                to="/settings"
                className="btn btn-ghost btn-sm gap-2 hover:bg-white/10"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                Settings
              </Link>
            )}
          </div>

          <button className="btn btn-ghost btn-circle btn-sm hover:bg-white/10" onClick={toggleTheme}>
            <MoonIcon className="w-5 h-5 hidden dark:block" />
            <SunIcon className="w-5 h-5 dark:hidden" />
          </button>

          {user ? (
            <div className="relative" ref={dropdownRef as React.RefObject<HTMLDivElement>}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="btn btn-ghost btn-circle avatar placeholder hover:bg-white/10 flex items-center justify-center"
              >
                {user.photoUrl ? (
                  <div className="w-8 sm:w-10 rounded-full overflow-hidden ring-2 ring-white/30">
                    <img alt={user.displayName ?? 'Profile'} src={user.photoUrl} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="bg-brand-emerald/30 text-white rounded-full w-8 sm:w-10 flex items-center justify-center ring-2 ring-brand-emerald/40">
                    <span className="text-sm font-bold">
                      {user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <ul className="absolute right-0 top-full mt-2 menu bg-brand-deep border border-brand-border text-base-content rounded-2xl z-50 w-64 p-2 shadow-2xl">
                  {/* User info header */}
                  <li className="px-3 py-2 border-b border-brand-border mb-1">
                    <div className="flex items-center gap-3 cursor-default hover:bg-transparent focus:bg-transparent active:bg-transparent">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-emerald/30" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brand-emerald/20 flex items-center justify-center ring-2 ring-brand-emerald/30">
                          <span className="text-xs font-bold text-brand-emerald">
                            {user.displayName?.[0]?.toUpperCase() ?? 'U'}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{user.displayName ?? 'User'}</p>
                        <p className="text-white/30 text-xs truncate">{user.email}</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <Link to="/profile" onClick={closeDropdown} className="gap-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl">
                      <UserCircleIcon className="w-4 h-4" /> Edit Profile
                    </Link>
                  </li>
                  <li className="lg:hidden">
                    <Link to="/settings" onClick={closeDropdown} className="gap-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl">
                      <Cog6ToothIcon className="w-4 h-4" /> Settings
                    </Link>
                  </li>
                  <div className="divider my-1 border-brand-border" />
                  <li>
                    <button
                      className="gap-2 text-error hover:bg-red-500/10 rounded-xl"
                      onClick={() => { closeDropdown(); setConfirmLogout(true); }}
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" /> Sign Out
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-sm bg-white text-brand-emerald hover:bg-white/90 border-0 shadow-md"
              onClick={() => sessionStorage.setItem('ihsan_redirect', location.pathname)}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {user && !hideSalam && (
        <div className="md:hidden bg-gradient-to-r from-[#0a1a0d] to-brand-deep px-4 py-2 text-center border-b border-brand-emerald/20">
          <p
            className="text-xs sm:text-sm font-extrabold truncate"
            style={{
              backgroundImage: 'linear-gradient(90deg, var(--brand-emerald,#10b981) 0%, var(--brand-gold,#f59e0b) 50%, var(--brand-magenta,#c026d3) 100%)',
              backgroundSize: '200% 100%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              animation: 'navbarShimmer 10s linear infinite',
            }}
          >
            {salam}
          </p>
        </div>
      )}

      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card bg-brand-surface border border-brand-border shadow-glass w-full max-w-md">
            <div className="card-body gap-4">
              <h3 className="card-title text-brand-emerald">Sign Out?</h3>
              <p className="text-sm opacity-70">Are you sure you want to sign out? Unsaved counts will be lost.</p>
              <div className="card-actions justify-end gap-2">
                <button className="btn btn-ghost" onClick={() => setConfirmLogout(false)}>Cancel</button>
                <button
                  className="btn btn-error"
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
