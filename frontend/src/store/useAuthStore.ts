import { create } from 'zustand';
import { AuthUser } from '../types/api.js';

interface AuthState {
  user: AuthUser | null;
  aiEnabled: boolean;
  redirectPath: string;
  authLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setRedirectPath: (path: string) => void;
  setAiEnabled: (aiEnabled: boolean) => void;
  setAuthLoading: (authLoading: boolean) => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  aiEnabled: false,
  redirectPath: '/',
  authLoading: true,

  setUser: (user) => set({ user }),

  setRedirectPath: (path) => set({ redirectPath: path || '/' }),

  setAiEnabled: (aiEnabled) => {
    localStorage.setItem('ihsan_ai_enabled', aiEnabled ? '1' : '0');
    set({ aiEnabled });
  },

  setAuthLoading: (authLoading) => set({ authLoading }),

  init: () => {
    const ai = localStorage.getItem('ihsan_ai_enabled');
    // Optimistic session restore: render the app instantly from the cached
    // user instead of blocking on Firebase + backend. onAuthStateChanged in
    // App.tsx confirms (or clears) the session moments later. Without this,
    // a cold Render backend held the whole UI hostage for up to a minute.
    let cachedUser: AuthUser | null = null;
    try {
      cachedUser = JSON.parse(localStorage.getItem('ihsan_user') ?? 'null') as AuthUser | null;
    } catch {
      cachedUser = null;
    }
    if (cachedUser?.uid) {
      set({ aiEnabled: ai === '1', user: cachedUser, authLoading: false });
    } else {
      set({ aiEnabled: ai === '1' });
    }
  },
}));
