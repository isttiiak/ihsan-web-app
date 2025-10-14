import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useAuthStore } from "./store/useAuthStore";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";

const AuthGate = ({ children }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const Login = () => {
  const { setUser } = useAuthStore();

  const verifyWithBackend = async (idToken, user) => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    const data = await res.json();
    if (data.ok) {
      localStorage.setItem("ihsan_idToken", idToken);
      localStorage.setItem(
        "ihsan_user",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        })
      );
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });
    }
  };

  const google = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    await verifyWithBackend(idToken, result.user);
  };

  const emailPassword = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      await verifyWithBackend(idToken, result.user);
    } catch {
      // Try sign up
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await result.user.getIdToken();
      await verifyWithBackend(idToken, result.user);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-md shadow-xl">
        <div className="card-body gap-4">
          <h2 className="card-title justify-center">Ihsan — Log in</h2>
          <button className="btn btn-primary" onClick={google}>
            Continue with Google
          </button>
          <div className="divider">or</div>
          <form onSubmit={emailPassword} className="flex flex-col gap-2">
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="input input-bordered"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              className="input input-bordered"
              required
            />
            <button className="btn btn-secondary" type="submit">
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const { setUser, init } = useAuthStore();

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
      // re-verify on refresh
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      localStorage.setItem("ihsan_idToken", idToken);
      const user = { uid: u.uid, email: u.email, displayName: u.displayName };
      localStorage.setItem("ihsan_user", JSON.stringify(user));
      setUser(user);
    });
    return () => unsub();
  }, [setUser, init]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <AuthGate>
                <Dashboard />
              </AuthGate>
            }
          />
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
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
