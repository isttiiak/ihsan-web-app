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
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";
import AuthSignIn from "./pages/AuthSignIn";
import AuthSignUp from "./pages/AuthSignUp";
import UnsavedWarning from "./components/UnsavedWarning";
import Profile from "./pages/Profile";

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
  const { hydrate, resetAll } = useZikrStore();
  const navigate = useNavigate();
  const location = useLocation();

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
      const idToken = await u.getIdToken();
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      localStorage.setItem("ihsan_idToken", idToken);
      const user = { uid: u.uid, email: u.email, displayName: u.displayName };
      localStorage.setItem("ihsan_user", JSON.stringify(user));
      setUser(user);
      try {
        hydrate();
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

  return (
    <div className="min-h-screen flex flex-col">
      {authLoading ? (
        <div className="flex-1 grid place-items-center">
          <div className="flex flex-col items-center gap-4 opacity-80">
            <span className="loading loading-spinner loading-lg" />
            <div className="text-sm">Preparing your session…</div>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          <UnsavedWarning />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/analytics"
                element={
                  <Protected>
                    <Analytics />
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
          <Footer />
        </>
      )}
    </div>
  );
}
