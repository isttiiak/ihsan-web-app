import { create } from 'zustand';
import { AuthUser } from '../types/api.js';
import { getDemoUser } from '../utils/demoData.js';

interface AuthState {
  user: AuthUser | null;
  aiEnabled: boolean;
  redirectPath: string;
  authLoading: boolean;
  isDemoMode: boolean;
  setUser: (user: AuthUser | null) => void;
  setRedirectPath: (path: string) => void;
  setAiEnabled: (aiEnabled: boolean) => void;
  setAuthLoading: (authLoading: boolean) => void;
  enterDemoMode: (gender: string) => void;
  exitDemoMode: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  aiEnabled: false,
  redirectPath: '/',
  // Starts true; overridden synchronously by the self-init call below so
  // returning users with a cached session never see the "Preparing…" spinner.
  authLoading: true,
  isDemoMode: false,

  setUser: (user) => set({ user }),

  setRedirectPath: (path) => set({ redirectPath: path || '/' }),

  setAiEnabled: (aiEnabled) => {
    localStorage.setItem('ihsan_ai_enabled', aiEnabled ? '1' : '0');
    set({ aiEnabled });
  },

  setAuthLoading: (authLoading) => set({ authLoading }),

  enterDemoMode: (gender: string) => {
    // Pure in-memory — no sessionStorage, so a page refresh always shows the landing.
    set({ user: getDemoUser(gender), isDemoMode: true, authLoading: false });
  },

  exitDemoMode: () => {
    set({ user: null, isDemoMode: false });
  },

  init: () => {
    const ai = localStorage.getItem('ihsan_ai_enabled');

    let cachedUser: AuthUser | null = null;
    try {
      cachedUser = JSON.parse(localStorage.getItem('ihsan_user') ?? 'null') as AuthUser | null;
    } catch {
      // cachedUser already defaults to null
    }
    if (cachedUser?.uid) {
      set({ aiEnabled: ai === '1', user: cachedUser, authLoading: false });
    } else {
      // No cached session — if there is also no token on disk, the user is
      // definitely signed out: show the landing immediately instead of flashing
      // a black spinner screen while Firebase confirms.
      const hasToken = !!localStorage.getItem('ihsan_idToken');
      set({ aiEnabled: ai === '1', ...(!hasToken && { authLoading: false }) });
    }
  },
}));

// Self-initialize synchronously at module load time — this runs before ANY
// React component renders, so returning users with a cached session start with
// authLoading=false and the correct user already set. The effect-based init()
// call in App.tsx is idempotent and kept for correctness but is now a no-op
// for the common case.
useAuthStore.getState().init();
