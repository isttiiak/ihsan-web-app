import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../firebase.js';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function AuthSignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const google = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      if (fullName) {
        try {
          await updateProfile(res.user, { displayName: fullName });
        } catch {}
      }
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-brand-void">
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 rounded-full bg-gradient-to-r from-brand-emerald/20 to-teal-500/20 blur-3xl"
        animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gradient-to-r from-brand-magenta/20 to-purple-500/20 blur-3xl"
        animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-r from-brand-gold/15 to-amber-500/15 blur-3xl"
        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="relative backdrop-blur-xl bg-brand-surface/80 rounded-3xl shadow-2xl border border-brand-border/60 overflow-hidden">
            <div className="relative p-8 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center space-y-2"
              >
                <h2 className="text-4xl sm:text-5xl font-bold text-brand-emerald">Join Ihsan</h2>
                <p className="text-white/60 text-sm sm:text-base">Start your spiritual journey today</p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 border border-white/20"
                onClick={google}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-md" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign up with Google
                  </>
                )}
              </motion.button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-brand-surface text-white/40">OR</span>
                </div>
              </div>

              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                onSubmit={onSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white/70 text-sm font-medium">First Name</label>
                    <input
                      name="firstName"
                      type="text"
                      placeholder="First name"
                      className="w-full px-4 py-3 bg-white/5 border border-brand-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-emerald/50 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/70 text-sm font-medium">Last Name</label>
                    <input
                      name="lastName"
                      type="text"
                      placeholder="Last name"
                      className="w-full px-4 py-3 bg-white/5 border border-brand-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-emerald/50 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-medium">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-brand-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-emerald/50 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      className="w-full px-4 py-3 pr-12 bg-white/5 border border-brand-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-emerald/50 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5 text-white/50" /> : <EyeIcon className="w-5 h-5 text-white/50" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-4 bg-brand-emerald hover:bg-brand-emerald-dim text-white rounded-xl font-semibold shadow-lg transition-all duration-300"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner loading-md" /> : 'Create Account'}
                </motion.button>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-center text-sm"
              >
                <span className="text-white/50">Already have an account? </span>
                <a
                  className="text-brand-emerald font-semibold hover:text-brand-emerald-dim transition-colors cursor-pointer"
                  href="/login"
                  onClick={(e) => { e.preventDefault(); navigate('/login'); }}
                >
                  Log in
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
