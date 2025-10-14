import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  aiEnabled: false,
  setUser: (user) => set({ user }),
  setAiEnabled: (aiEnabled) => {
    localStorage.setItem("ihsan_ai_enabled", aiEnabled ? "1" : "0");
    set({ aiEnabled });
  },
  init: () => {
    const ai = localStorage.getItem("ihsan_ai_enabled");
    set({ aiEnabled: ai === "1" });
  },
}));
