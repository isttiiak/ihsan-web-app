import React from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function AuthSignIn() {
  const verifyWithBackend = async (idToken, user) => {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    localStorage.setItem("ihsan_idToken", idToken);
    localStorage.setItem(
      "ihsan_user",
      JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      })
    );
    const redirect = sessionStorage.getItem("ihsan_redirect") || "/";
    sessionStorage.removeItem("ihsan_redirect");
    window.location.replace(redirect);
  };

  const google = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    await verifyWithBackend(idToken, result.user);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const res = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await res.user.getIdToken();
    await verifyWithBackend(idToken, res.user);
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
            <button className="btn btn-primary" onClick={google}>
              Continue with Google
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
              <button className="btn btn-secondary" type="submit">
                Log in
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
