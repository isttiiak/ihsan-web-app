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

const AuthGate = ({ children }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const { setUser, init } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    init();
    const theme = localStorage.getItem("ihsan_theme") || "emerald";
    document.documentElement.setAttribute("data-theme", theme);
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        localStorage.removeItem("ihsan_user");
        localStorage.removeItem("ihsan_idToken");
        return;
      }
      const idToken = await u.getIdToken();
      // verify token (dev bypass ok)
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      localStorage.setItem("ihsan_idToken", idToken);
      const user = { uid: u.uid, email: u.email, displayName: u.displayName };
      localStorage.setItem("ihsan_user", JSON.stringify(user));
      setUser(user);

      // If user just logged in, save any offline session
      try {
        await useZikrStore.getState().saveSession();
      } catch {}

      // Redirect to intended page if set
      const redirect = sessionStorage.getItem("ihsan_redirect");
      if (redirect && location.pathname === "/login") {
        sessionStorage.removeItem("ihsan_redirect");
        navigate(redirect || "/", { replace: true });
      }
    });
    return () => unsub();
  }, [setUser, init, navigate, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <UnsavedWarning />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/analytics"
            element={
              <AuthGate>
                <Analytics />
              </AuthGate>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthGate>
                <Settings />
              </AuthGate>
            }
          />
          <Route path="/login" element={<AuthSignIn />} />
          <Route path="/signup" element={<AuthSignUp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
