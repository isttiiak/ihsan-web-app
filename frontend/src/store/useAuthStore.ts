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
    set({ aiEnabled: ai === '1' });
    // leave authLoading as true; App will flip it after Firebase resolves
  },
}));
