import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, AuthError } from 'firebase/auth';
import { auth, googleProvider } from '../firebase.js';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Sign in failed. Please try again.';
  }
}

export default function AuthSignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const google = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as AuthError).code ?? '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError(mapFirebaseError(code));
      }
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(mapFirebaseError((err as AuthError).code ?? ''));
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-brand-void">
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 left-0 w-96 h-96 rounded-full bg-gradient-to-br from-brand-emerald/25 to-teal-500/25 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gradient-to-br from-brand-magenta/25 to-purple-500/25 blur-3xl"
      />

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div
            variants={itemVariants}
            className="relative bg-brand-surface/80 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-brand-border/60"
          >
            <div className="space-y-8">
              <motion.div variants={itemVariants} className="text-center space-y-3">
                <h1 className="text-4xl sm:text-5xl font-bold text-brand-emerald">Welcome Back</h1>
                <p className="text-white/60 text-sm sm:text-base">Log in to continue your spiritual journey</p>
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full relative group bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={google}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-md text-brand-emerald" />
                ) : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </motion.button>

              <motion.div variants={itemVariants} className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-brand-surface text-white/40">or continue with email</span>
                </div>
              </motion.div>

              <motion.form variants={itemVariants} onSubmit={onSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    onChange={() => error && setError('')}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-brand-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-emerald/50 focus:border-transparent transition-all duration-300"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      onChange={() => error && setError('')}
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-brand-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-emerald/50 focus:border-transparent transition-all duration-300 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-emerald hover:bg-brand-emerald-dim text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <span className="loading loading-spinner loading-sm" /> : 'Sign In'}
                </motion.button>
              </motion.form>

              <motion.div variants={itemVariants} className="text-center">
                <p className="text-brand-gold/50 text-xs italic mb-3 px-2">
                  💡 For the most flexible experience (instant photo, easier sign-in), use <span className="font-semibold text-brand-gold/70">Continue with Google</span>.
                </p>
              </motion.div>
              <motion.div variants={itemVariants} className="text-center">
                <p className="text-white/40 text-sm">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/signup')}
                    className="text-brand-emerald hover:text-brand-emerald-dim font-semibold transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
