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
    sessionStorage.setItem('ihsan_demo_mode', gender);
    set({ user: getDemoUser(gender), isDemoMode: true, authLoading: false });
  },

  exitDemoMode: () => {
    sessionStorage.removeItem('ihsan_demo_mode');
    set({ user: null, isDemoMode: false });
  },

  init: () => {
    const ai = localStorage.getItem('ihsan_ai_enabled');

    const demoGender = sessionStorage.getItem('ihsan_demo_mode');
    if (demoGender) {
      set({ aiEnabled: ai === '1', user: getDemoUser(demoGender), isDemoMode: true, authLoading: false });
      return;
    }

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
