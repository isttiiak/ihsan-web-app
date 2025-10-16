import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { useAuthStore } from "./store/useAuthStore";
import { useZikrStore } from "./store/useZikrStore";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ZikrCounter from "./pages/ZikrCounter";
import ZikrAnalytics from "./pages/ZikrAnalytics";
import Settings from "./pages/Settings";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";
import AuthSignIn from "./pages/AuthSignIn";
import AuthSignUp from "./pages/AuthSignUp";
import UnsavedWarning from "./components/UnsavedWarning";
import Profile from "./pages/Profile";
import SalatTracker from "./pages/SalatTracker";
import FastingTracker from "./pages/FastingTracker";
import PrayerTimes from "./pages/PrayerTimes";

const Protected = ({ children }) => {
  const { user, authLoading } = useAuthStore();
  const location = useLocation();
  if (authLoading) return null; // wait for auth resolution to avoid flicker
  if (!user) {
    sessionStorage.setItem(
      "ihsan_redirect",
      location.pathname + location.search
    );
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  const { setUser, init, setAuthLoading } = useAuthStore();
  const { hydrate, resetAll, checkAndResetIfNewDay } = useZikrStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Smart detection: Check for new day when user interacts with the app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, check for new day
        checkAndResetIfNewDay();
      }
    };

    const handleFocus = () => {
      // Window gained focus, check for new day
      checkAndResetIfNewDay();
    };

    // Also check on route change
    checkAndResetIfNewDay();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAndResetIfNewDay, location.pathname]);

  useEffect(() => {
    init();
    const theme = localStorage.getItem("ihsan_theme") || "emerald";
    document.documentElement.setAttribute("data-theme", theme);
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        resetAll(); // clear on logout
        localStorage.removeItem("ihsan_user");
        localStorage.removeItem("ihsan_idToken");
        setAuthLoading(false);
        return;
      }
      // Do NOT reset here so counts persist across reloads
      const idToken = await u.getIdToken(true);
      const verifyRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ idToken }),
        }
      );

      if (!verifyRes.ok) {
        const errorText = await verifyRes.text();
        console.error("Verify failed:", {
          status: verifyRes.status,
          body: errorText,
          backend: import.meta.env.VITE_BACKEND_URL,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        });
        alert(
          `Auth verification failed (${verifyRes.status}). Check console for details.`
        );
        // Force logout if verify fails
        await auth.signOut();
        setAuthLoading(false);
        return;
      }

      localStorage.setItem("ihsan_idToken", idToken);
      const user = { uid: u.uid, email: u.email, displayName: u.displayName };
      localStorage.setItem("ihsan_user", JSON.stringify(user));
      setUser(user);
      try {
        await hydrate();
      } catch {}
      const redirect = sessionStorage.getItem("ihsan_redirect");
      if (redirect && ["/login", "/signup"].includes(location.pathname)) {
        sessionStorage.removeItem("ihsan_redirect");
        navigate(redirect || "/", { replace: true });
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [
    setUser,
    init,
    navigate,
    location.pathname,
    resetAll,
    hydrate,
    setAuthLoading,
  ]);

  const { authLoading } = useAuthStore();

  // Define focus mode routes (no navbar/footer)
  const focusModeRoutes = ["/zikr", "/salat", "/fasting", "/prayer-times"];
  const isFocusMode = focusModeRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      {authLoading ? (
        <div className="flex-1 grid place-items-center bg-gradient-to-br from-ihsan-light via-base-100 to-ihsan-light/50">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-ihsan-primary" />
            <div className="text-sm opacity-70">Preparing your session…</div>
          </div>
        </div>
      ) : (
        <>
          {!isFocusMode && <Navbar />}
          {!isFocusMode && <UnsavedWarning />}
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/zikr" element={<ZikrCounter />} />
              <Route path="/salat" element={<SalatTracker />} />
              <Route path="/fasting" element={<FastingTracker />} />
              <Route path="/prayer-times" element={<PrayerTimes />} />
              <Route
                path="/zikr/analytics"
                element={
                  <Protected>
                    <ZikrAnalytics />
                  </Protected>
                }
              />
              <Route
                path="/settings"
                element={
                  <Protected>
                    <Settings />
                  </Protected>
                }
              />
              <Route
                path="/profile"
                element={
                  <Protected>
                    <Profile />
                  </Protected>
                }
              />
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
