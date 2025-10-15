import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AuthSignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const google = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in App.jsx will handle verify and redirect
    } catch (err) {
      console.error(err);
      alert(err.message);
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged in App.jsx will handle verify and redirect
    } catch (err) {
      console.error(err);
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/40 to-amber-100/40 dark:from-emerald-900/30 dark:to-amber-900/30"></div>
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="card bg-base-200/80 backdrop-blur w-full max-w-lg shadow-2xl">
          <div className="card-body gap-4">
            <h2 className="card-title justify-center text-2xl">
              Log in to Ihsan
            </h2>
            <button className="btn btn-primary" onClick={google} disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Continue with Google"}
            </button>
            <div className="divider">or</div>
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2">
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
              <button className="btn btn-secondary" type="submit" disabled={loading}>
                {loading ? <span className="loading loading-spinner loading-sm" /> : "Log in"}
              </button>
            </form>
            <div className="text-sm text-center opacity-70">
              Don’t have an account?{" "}
              <a
                className="link"
                href="/signup"
                onClick={(e) => {
                  e.preventDefault();
                  sessionStorage.setItem("ihsan_redirect", location.pathname);
                  window.location.href = "/signup";
                }}
              >
                Sign up
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
