import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { auth } from './firebase.js';
import { useAuthStore } from './store/useAuthStore.js';
import { useZikrStore } from './store/useZikrStore.js';
import Navbar from './components/Navbar.js';
import Home from './pages/Home.js';
import ZikrCounter from './pages/ZikrCounter.js';
import Footer from './components/Footer.js';
import NotFound from './pages/NotFound.js';
import UnsavedWarning from './components/UnsavedWarning.js';
import type { AuthUser } from './types/api.js';

// Route-level code splitting — analytics pages pull in recharts (~130KB gz)
// and Profile/Settings are large; keep them out of the initial bundle.
const ZikrAnalytics = lazy(() => import('./pages/ZikrAnalytics.js'));
const Settings = lazy(() => import('./pages/Settings.js'));
const AuthSignIn = lazy(() => import('./pages/AuthSignIn.js'));
const AuthSignUp = lazy(() => import('./pages/AuthSignUp.js'));
const AuthAction = lazy(() => import('./pages/AuthAction.js'));
const Profile = lazy(() => import('./pages/Profile.js'));
const SalatTracker = lazy(() => import('./pages/SalatTracker.js'));
const SalatAnalytics = lazy(() => import('./pages/SalatAnalytics.js'));
const FastingTracker = lazy(() => import('./pages/FastingTracker.js'));
const FastingAnalytics = lazy(() => import('./pages/FastingAnalytics.js'));
const PrayerTimes = lazy(() => import('./pages/PrayerTimes.js'));
const QuranHabit = lazy(() => import('./pages/QuranHabit.js'));
const IslamicSpecialDay = lazy(() => import('./pages/IslamicSpecialDay.js'));
const Friends = lazy(() => import('./pages/Friends.js'));
const ConnectFriend = lazy(() => import('./pages/ConnectFriend.js'));
const About = lazy(() => import('./pages/About.js'));
const Privacy = lazy(() => import('./pages/Privacy.js'));

function RouteFallback() {
  return (
    <div className="min-h-[60vh] grid place-items-center bg-brand-void">
      <span className="loading loading-spinner loading-lg text-brand-emerald" />
    </div>
  );
}

function VerifyEmailGate({ email }: { email: string | null }) {
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  const resend = async () => {
    if (resending || !auth.currentUser) return;
    setResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setResent(true);
    } catch { /* non-fatal */ }
    setResending(false);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm w-full">
        <div className="text-6xl">📧</div>
        <h2 className="text-2xl font-black text-white">Verify your email</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          A verification link was sent to{' '}
          <span className="text-brand-emerald font-medium">{email}</span>.
          Check your inbox (and spam folder) and click the link to unlock this page.
        </p>
        {resent ? (
          <p className="text-brand-emerald text-sm font-medium">Email resent! Check your inbox.</p>
        ) : (
          <button
            className="btn btn-ghost text-brand-emerald border border-brand-emerald/30 w-full"
            onClick={() => void resend()}
            disabled={resending}
          >
            {resending ? <span className="loading loading-spinner loading-xs" /> : 'Resend verification email'}
          </button>
        )}
      </div>
    </div>
  );
}

interface ProtectedProps {
  children: React.ReactNode;
}

const Protected = ({ children }: ProtectedProps) => {
  const { user, authLoading } = useAuthStore();
  const location = useLocation();
  const nav = useNavigate();
  if (authLoading) return null;
  if (!user) {
    const redirectTarget = location.pathname + location.search;
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-sm w-full">
          <div className="text-6xl">🔐</div>
          <h2 className="text-2xl font-black text-white">Sign in required</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            This page is only available to signed-in users. Create a free account to track your progress and access analytics.
          </p>
          <div className="flex flex-col gap-3">
            <button
              className="btn bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 w-full"
              onClick={() => {
                sessionStorage.setItem('ihsan_redirect', redirectTarget);
                nav('/login');
              }}
            >
              Sign In
            </button>
            <button
              className="btn btn-ghost text-brand-emerald border border-brand-emerald/30 w-full"
              onClick={() => {
                sessionStorage.setItem('ihsan_redirect', redirectTarget);
                nav('/signup');
              }}
            >
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (user.emailVerified === false) {
    return <VerifyEmailGate email={user.email} />;
  }
  return <>{children}</>;
};

export default function App() {
  const { setUser, init, setAuthLoading } = useAuthStore();
  const { hydrate, resetAll, checkAndResetIfNewDay } = useZikrStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Keep latest navigate/pathname in refs so the auth subscription below can
  // use them without re-subscribing on every route change. Re-subscribing was
  // forcing a token refresh + a /api/auth/verify roundtrip on EVERY navigation.
  const navigateRef = useRef(navigate);
  const pathnameRef = useRef(location.pathname);
  useEffect(() => {
    navigateRef.current = navigate;
    pathnameRef.current = location.pathname;
  });

  // Warm up the Render free-tier backend — fire once on mount, ignore response.
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Daily-reset listeners registered once; route changes also trigger a check below.
  useEffect(() => {
    const onVisibility = () => { if (!document.hidden) checkAndResetIfNewDay(); };
    const onFocus = () => checkAndResetIfNewDay();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkAndResetIfNewDay]);

  useEffect(() => { checkAndResetIfNewDay(); }, [checkAndResetIfNewDay, location.pathname]);

  // Google Analytics 4: SPA page views (the gtag loader in index.html sets
  // send_page_view=false, so each route change is reported exactly once here)
  useEffect(() => {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void; __IHSAN_GA_ID?: string };
    if (w.gtag && w.__IHSAN_GA_ID) {
      w.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [location.pathname, location.search]);

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

      try {
        const idToken = await u.getIdToken();
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

        // Prefer the displayName from our DB (user may have edited it in Profile)
        // Fall back to Firebase display name for brand-new accounts
        let dbDisplayName: string | null | undefined = u.displayName;
        if (verifyRes.ok) {
          try {
            const verifyData = await verifyRes.clone().json() as { user?: { displayName?: string } };
            if (verifyData?.user?.displayName) dbDisplayName = verifyData.user.displayName;
          } catch { /* ignore parse error */ }
        }

        // Also carry over the photo URL: prefer DB value (user may have uploaded custom photo),
        // fall back to Firebase/Google profile picture.
        let dbPhotoUrl: string | null | undefined = u.photoURL ?? null;
        if (verifyRes.ok) {
          try {
            const verifyDataForPhoto = await verifyRes.clone().json() as { user?: { photoUrl?: string } };
            if (verifyDataForPhoto?.user?.photoUrl) dbPhotoUrl = verifyDataForPhoto.user.photoUrl;
          } catch { /* ignore */ }
        }

        const authUser: AuthUser = {
          uid: u.uid,
          email: u.email,
          displayName: dbDisplayName ?? u.displayName,
          photoUrl: dbPhotoUrl,
          emailVerified: u.emailVerified,
        };
        localStorage.setItem('ihsan_user', JSON.stringify(authUser));
        setUser(authUser);
        try { await hydrate(); } catch { /* hydrate errors are non-fatal */ }
        // Push any counts made while signed out — the guest dialog promises
        // "Sign in to save", so save immediately rather than on the next tap.
        try { await useZikrStore.getState().flush(); } catch { /* retried on next tap */ }

        // Only navigate away from /login or /signup once the email is verified.
        // Unverified email/password accounts stay on /signup so the verification screen shows.
        if (['/login', '/signup'].includes(pathnameRef.current) && u.emailVerified) {
          const redirect = sessionStorage.getItem('ihsan_redirect');
          sessionStorage.removeItem('ihsan_redirect');
          navigateRef.current(redirect || '/', { replace: true });
        }
      } catch (err) {
        // Network failure or unexpected error — don't leave the spinner running forever
        console.error('Auth setup error:', err);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsub();
    // Subscribe exactly once — navigation is handled via refs above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser, init, resetAll, hydrate, setAuthLoading]);

  const { authLoading } = useAuthStore();
  const isAuthPage = ['/login', '/signup', '/auth/action'].includes(location.pathname);
  const noFooterRoutes = ['/zikr', '/salat', '/salat/analytics', '/fasting', '/fasting/analytics', '/prayer-times', '/quran', '/friends'];
  const showFooter = !isAuthPage && !noFooterRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      {/* Single app-wide toaster — pages must not mount their own */}
      <Toaster />
      {authLoading ? (
        <div className="flex-1 grid place-items-center bg-brand-void">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-brand-emerald" />
            <div className="text-sm text-white/50">Preparing your session…</div>
          </div>
        </div>
      ) : (
        <>
          {!isAuthPage && <Navbar />}
          {!isAuthPage && <UnsavedWarning />}
          <div className="flex-1">
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/zikr" element={<ZikrCounter />} />
              <Route path="/salat" element={<SalatTracker />} />
              <Route path="/salat/analytics" element={<Protected><SalatAnalytics /></Protected>} />
              <Route path="/fasting" element={<FastingTracker />} />
              <Route path="/fasting/analytics" element={<Protected><FastingAnalytics /></Protected>} />
              <Route path="/prayer-times" element={<PrayerTimes />} />
              <Route path="/quran" element={<Protected><QuranHabit /></Protected>} />
              <Route path="/zikr/analytics" element={<Protected><ZikrAnalytics /></Protected>} />
              <Route path="/settings" element={<Protected><Settings /></Protected>} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/special-day/:id" element={<IslamicSpecialDay />} />
              <Route path="/friends" element={<Protected><Friends /></Protected>} />
              {/* Public: handles guests itself (sign-in gate that returns here) */}
              <Route path="/connect/:code" element={<ConnectFriend />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/login" element={<AuthSignIn />} />
              <Route path="/signup" element={<AuthSignUp />} />
              <Route path="/auth/action" element={<AuthAction />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </div>
          {showFooter && <Footer />}
        </>
      )}
    </div>
  );
}
