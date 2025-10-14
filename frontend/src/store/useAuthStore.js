import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  aiEnabled: false,
  redirectPath: "/",
  authLoading: true,
  setUser: (user) => set({ user }),
  setRedirectPath: (path) => set({ redirectPath: path || "/" }),
  setAiEnabled: (aiEnabled) => {
    localStorage.setItem("ihsan_ai_enabled", aiEnabled ? "1" : "0");
    set({ aiEnabled });
  },
  setAuthLoading: (authLoading) => set({ authLoading }),
  init: () => {
    const ai = localStorage.getItem("ihsan_ai_enabled");
    set({ aiEnabled: ai === "1" });
    // leave authLoading as true; App will flip it after Firebase resolves
  },
}));
