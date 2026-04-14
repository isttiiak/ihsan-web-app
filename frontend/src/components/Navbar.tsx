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
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  const salam = `Assalamu 'alaikum${user?.displayName ? ', ' + user.displayName.split(' ')[0] : ''}`;
  const focusRoutes = ['/zikr', '/salat', '/fasting', '/prayer-times'];
  const hideSalam = focusRoutes.includes(location.pathname);

  useEffect(() => {
    if (dropdownRef.current?.hasAttribute('open')) {
      dropdownRef.current.removeAttribute('open');
    }
  }, [location.pathname]);

  const closeDropdown = () => dropdownRef.current?.removeAttribute('open');

  const toggleTheme = () => {
    const theme = document.documentElement.getAttribute('data-theme') ?? 'ihsan';
    const next = theme === 'ihsan' ? 'light' : theme === 'light' ? 'ihsan' : 'ihsan';
    localStorage.setItem('ihsan_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <>
      <div className="navbar bg-gradient-to-r from-brand-emerald to-brand-emerald-dim text-white shadow-islamic sticky top-0 z-40 px-2 sm:px-4">
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
            <details className="dropdown dropdown-end" ref={dropdownRef}>
              <summary className="btn btn-ghost btn-circle avatar placeholder hover:bg-white/10">
                {user.photoUrl ? (
                  <div className="w-8 sm:w-10 rounded-full overflow-hidden ring-2 ring-white/30">
                    <img alt={user.displayName ?? 'Profile'} src={user.photoUrl} />
                  </div>
                ) : (
                  <div className="bg-white/20 text-white rounded-full w-8 sm:w-10 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {user.displayName?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  </div>
                )}
              </summary>
              <ul className="menu dropdown-content bg-brand-deep border border-brand-border text-base-content rounded-box z-[1] w-64 p-2 shadow-glass mt-3">
                <li className="menu-title"><span className="text-brand-emerald">Profile</span></li>
                <li>
                  <Link to="/profile" onClick={closeDropdown} className="gap-2">
                    <UserCircleIcon className="w-5 h-5" /> Edit Profile
                  </Link>
                </li>
                <li className="lg:hidden">
                  <Link to="/settings" onClick={closeDropdown} className="gap-2">
                    <Cog6ToothIcon className="w-5 h-5" /> Settings
                  </Link>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <button className="text-error gap-2" onClick={() => { closeDropdown(); setConfirmLogout(true); }}>
                    <ArrowRightOnRectangleIcon className="w-5 h-5" /> Sign Out
                  </button>
                </li>
              </ul>
            </details>
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
        <div className="md:hidden bg-gradient-to-r from-brand-emerald/10 to-brand-emerald-dim/10 px-4 py-2 text-center border-b border-brand-border">
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
