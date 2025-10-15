import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function AuthSignUp() {
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
    const firstName = e.target.firstName.value.trim();
    const lastName = e.target.lastName.value.trim();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const fullName = [firstName, lastName].filter(Boolean).join(" ");
      if (fullName) {
        try {
          await updateProfile(res.user, { displayName: fullName });
        } catch {}
      }
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
              Create your Ihsan account
            </h2>
            <button className="btn btn-primary" onClick={google} disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Sign up with Google"}
            </button>
            <div className="divider">or</div>
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  className="input input-bordered"
                />
                <input
                  name="lastName"
                  type="text"
                  placeholder="Last name"
                  className="input input-bordered"
                />
              </div>
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
                {loading ? <span className="loading loading-spinner loading-sm" /> : "Sign up"}
              </button>
            </form>
            <div className="text-sm text-center opacity-70">
              Already have an account?{" "}
              <a
                className="link"
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  sessionStorage.setItem("ihsan_redirect", location.pathname);
                  window.location.href = "/login";
                }}
              >
                Log in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
