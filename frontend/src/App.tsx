import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { auth } from './firebase.js';
import { API_BASE } from './lib/api.js';
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
const Feedback = lazy(() => import('./pages/Feedback.js'));
const Contact = lazy(() => import('./pages/Contact.js'));
const RayhanahCycle = lazy(() => import('./pages/RayhanahCycle.js'));
const RamadanTracker = lazy(() => import('./pages/RamadanTracker.js'));
const CycleAnalytics = lazy(() => import('./pages/CycleAnalytics.js'));
const QuranKhatam = lazy(() => import('./pages/QuranKhatam.js'));
const QuranBrowse = lazy(() => import('./pages/QuranBrowse.js'));
const QuranListen = lazy(() => import('./pages/QuranListen.js'));
const QuranAnalytics = lazy(() => import('./pages/QuranAnalytics.js'));
const QuranReader = lazy(() => import('./pages/QuranReader.js'));
const QuranBookmarks = lazy(() => import('./pages/QuranBookmarks.js'));
const Landing = lazy(() => import('./pages/Landing.js'));

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

/** "/" shows the marketing landing to guests and the app home to users. */
const RootRoute = () => {
  const { user, authLoading } = useAuthStore();
  if (user) return <Home />;
  if (authLoading) return <RouteFallback />;
  return (
    <Suspense fallback={<RouteFallback />}>
      <Landing />
    </Suspense>
  );
};

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
  const queryClient = useQueryClient();
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

  // The backend now runs as a Vercel function on the SAME deployment — there
  // is no Render cold start to warm up, so the old health-ping + amber
  // "waking up the server" banner are gone.

  // Prefetch the most-visited lazy chunks while the browser is idle, so
  // tapping Salat/Quran/Fasting/Prayer-times never shows the route spinner.
  useEffect(() => {
    const prefetch = () => {
      void import('./pages/SalatTracker.js');
      void import('./pages/QuranHabit.js');
      void import('./pages/FastingTracker.js');
      void import('./pages/PrayerTimes.js');
    };
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(prefetch, 2500); // Safari has no requestIdleCallback
    return () => clearTimeout(t);
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
        // The persisted React Query cache holds personal stats (incl. cycle
        // data) — never leave it behind after sign-out on a shared device.
        queryClient.clear();
        localStorage.removeItem('ihsan_rq_cache');
        setAuthLoading(false);
        return;
      }

      // Render the app IMMEDIATELY from Firebase's local session — never make
      // the user wait on our backend (Render free tier can take ~60s to wake).
      // Prefer the richer cached copy (DB displayName/photo) for the same account.
      const optimistic: AuthUser = {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoUrl: u.photoURL ?? null,
        emailVerified: u.emailVerified,
      };
      try {
        const cached = JSON.parse(localStorage.getItem('ihsan_user') ?? 'null') as AuthUser | null;
        if (cached?.uid === u.uid) {
          optimistic.displayName = cached.displayName ?? optimistic.displayName;
          optimistic.photoUrl = cached.photoUrl ?? optimistic.photoUrl;
        }
      } catch { /* corrupt cache — Firebase values are fine */ }
      setUser(optimistic);
      setAuthLoading(false);

      // Only navigate away from /login or /signup once the email is verified.
      // Unverified email/password accounts stay on /signup so the verification screen shows.
      if (['/login', '/signup'].includes(pathnameRef.current) && u.emailVerified) {
        const redirect = sessionStorage.getItem('ihsan_redirect');
        sessionStorage.removeItem('ihsan_redirect');
        navigateRef.current(redirect || '/', { replace: true });
      }

      // Everything below is a BACKGROUND sync — it must never gate rendering.
      void (async () => {
        try {
          const idToken = await u.getIdToken();
          localStorage.setItem('ihsan_idToken', idToken);
          const verifyRes = await fetch(`${API_BASE}/api/auth/verify`, {
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
              return;
            }
            console.warn(`Verify returned ${verifyRes.status} — keeping session alive`);
          } else {
            // Reconcile with the DB profile (user may have edited name/photo there)
            try {
              const verifyData = await verifyRes.json() as { user?: { displayName?: string; photoUrl?: string; gender?: AuthUser['gender'] } };
              const authUser: AuthUser = {
                ...optimistic,
                displayName: verifyData?.user?.displayName || optimistic.displayName,
                photoUrl: verifyData?.user?.photoUrl || optimistic.photoUrl,
                gender: verifyData?.user?.gender ?? optimistic.gender,
              };
              localStorage.setItem('ihsan_user', JSON.stringify(authUser));
              setUser(authUser);
            } catch { /* ignore parse error — optimistic values stand */ }
          }

          try { await hydrate(); } catch { /* hydrate errors are non-fatal */ }
          // Push any counts made while signed out — the guest dialog promises
          // "Sign in to save", so save immediately rather than on the next tap.
          try { await useZikrStore.getState().flush(); } catch { /* retried on next tap */ }
        } catch (err) {
          console.error('Auth background sync error:', err);
        }
      })();
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
              <Route path="/" element={<RootRoute />} />
              <Route path="/zikr" element={<ZikrCounter />} />
              <Route path="/salat" element={<SalatTracker />} />
              <Route path="/salat/analytics" element={<Protected><SalatAnalytics /></Protected>} />
              <Route path="/fasting" element={<FastingTracker />} />
              <Route path="/fasting/analytics" element={<Protected><FastingAnalytics /></Protected>} />
              <Route path="/prayer-times" element={<PrayerTimes />} />
              <Route path="/quran" element={<Protected><QuranHabit /></Protected>} />
              <Route path="/quran/khatam" element={<Protected><QuranKhatam /></Protected>} />
              <Route path="/quran/browse" element={<Protected><QuranBrowse /></Protected>} />
              <Route path="/quran/listen" element={<Protected><QuranListen /></Protected>} />
              <Route path="/quran/analytics" element={<Protected><QuranAnalytics /></Protected>} />
              <Route path="/quran/bookmarks" element={<Protected><QuranBookmarks /></Protected>} />
              <Route path="/quran/read/:surah" element={<Protected><QuranReader /></Protected>} />
              <Route path="/zikr/analytics" element={<Protected><ZikrAnalytics /></Protected>} />
              <Route path="/settings" element={<Protected><Settings /></Protected>} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/special-day/:id" element={<IslamicSpecialDay />} />
              <Route path="/friends" element={<Protected><Friends /></Protected>} />
              <Route path="/cycle" element={<Protected><RayhanahCycle /></Protected>} />
              <Route path="/ramadan" element={<Protected><RamadanTracker /></Protected>} />
              <Route path="/cycle/analytics" element={<Protected><CycleAnalytics /></Protected>} />
              {/* Public: handles guests itself (sign-in gate that returns here) */}
              <Route path="/connect/:code" element={<ConnectFriend />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/contact" element={<Contact />} />
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
