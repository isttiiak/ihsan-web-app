import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import { useAuthStore } from './store/useAuthStore.js';
import { useZikrStore } from './store/useZikrStore.js';
import Navbar from './components/Navbar.js';
import Home from './pages/Home.js';
import ZikrCounter from './pages/ZikrCounter.js';
import ZikrAnalytics from './pages/ZikrAnalytics.js';
import Settings from './pages/Settings.js';
import Footer from './components/Footer.js';
import NotFound from './pages/NotFound.js';
import AuthSignIn from './pages/AuthSignIn.js';
import AuthSignUp from './pages/AuthSignUp.js';
import UnsavedWarning from './components/UnsavedWarning.js';
import Profile from './pages/Profile.js';
import SalatTracker from './pages/SalatTracker.js';
import SalatAnalytics from './pages/SalatAnalytics.js';
import FastingTracker from './pages/FastingTracker.js';
import PrayerTimes from './pages/PrayerTimes.js';
import type { AuthUser } from './types/api.js';

interface ProtectedProps {
  children: React.ReactNode;
}

const Protected = ({ children }: ProtectedProps) => {
  const { user, authLoading } = useAuthStore();
  const location = useLocation();
  if (authLoading) return null;
  if (!user) {
    sessionStorage.setItem('ihsan_redirect', location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const { setUser, init, setAuthLoading } = useAuthStore();
  const { hydrate, resetAll, checkAndResetIfNewDay } = useZikrStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onVisibility = () => { if (!document.hidden) checkAndResetIfNewDay(); };
    const onFocus = () => checkAndResetIfNewDay();
    checkAndResetIfNewDay();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkAndResetIfNewDay, location.pathname]);

  useEffect(() => {
    init();
    const theme = localStorage.getItem('ihsan_theme') || 'ihsan';
    document.documentElement.setAttribute('data-theme', theme);

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        resetAll();
        localStorage.removeItem('ihsan_user');
        localStorage.removeItem('ihsan_idToken');
        setAuthLoading(false);
        return;
      }

      const idToken = await u.getIdToken(true);
      const verifyRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ idToken }),
      });

      if (!verifyRes.ok) {
        const errorText = await verifyRes.text();
        console.error('Verify failed:', { status: verifyRes.status, body: errorText });
        // Only sign out on genuine auth failures — not rate limits (429) or server errors (5xx)
        if (verifyRes.status === 401 || verifyRes.status === 403) {
          await auth.signOut();
          setAuthLoading(false);
          return;
        }
        // For 429/5xx: keep the user signed in, store the token we already have
        console.warn(`Verify returned ${verifyRes.status} — keeping session alive`);
      }

      localStorage.setItem('ihsan_idToken', idToken);
      const authUser: AuthUser = { uid: u.uid, email: u.email, displayName: u.displayName };
      localStorage.setItem('ihsan_user', JSON.stringify(authUser));
      setUser(authUser);
      try { await hydrate(); } catch {}

      const redirect = sessionStorage.getItem('ihsan_redirect');
      if (redirect && ['/login', '/signup'].includes(location.pathname)) {
        sessionStorage.removeItem('ihsan_redirect');
        navigate(redirect || '/', { replace: true });
      }
      setAuthLoading(false);
    });

    return () => unsub();
  }, [setUser, init, navigate, location.pathname, resetAll, hydrate, setAuthLoading]);

  const { authLoading } = useAuthStore();
  const focusModeRoutes = ['/zikr', '/salat', '/salat/analytics', '/fasting', '/prayer-times'];
  const isFocusMode = focusModeRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      {authLoading ? (
        <div className="flex-1 grid place-items-center bg-brand-void">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-brand-emerald" />
            <div className="text-sm text-white/50">Preparing your session…</div>
          </div>
        </div>
      ) : (
        <>
          {!isFocusMode && <Navbar />}
          {!isFocusMode && <UnsavedWarning />}
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/zikr" element={<ZikrCounter />} />
              <Route path="/salat" element={<SalatTracker />} />
              <Route path="/salat/analytics" element={<Protected><SalatAnalytics /></Protected>} />
              <Route path="/fasting" element={<FastingTracker />} />
              <Route path="/prayer-times" element={<PrayerTimes />} />
              <Route path="/zikr/analytics" element={<Protected><ZikrAnalytics /></Protected>} />
              <Route path="/settings" element={<Protected><Settings /></Protected>} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/login" element={<AuthSignIn />} />
              <Route path="/signup" element={<AuthSignUp />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          {!isFocusMode && <Footer />}
        </>
      )}
    </div>
  );
}
