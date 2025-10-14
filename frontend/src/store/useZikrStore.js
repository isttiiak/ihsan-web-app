import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useZikrStore = create(
  persist(
    (set, get) => ({
      types: [
        "SubhanAllah",
        "Alhamdulillah",
        "Allahu Akbar",
        "La ilaha illallah",
      ],
      selected: "SubhanAllah",
      count: 0,
      isSaving: false,
      setTypes: (types) => set({ types }),
      selectType: (selected) => set({ selected }),
      increment: () => set((s) => ({ count: s.count + 1 })),
      decrement: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
      reset: () => set({ count: 0 }),
      startAutoSaveTimer: () => {
        clearTimeout(get()._timer);
        const timer = setTimeout(() => get().saveSession(), 1000); // 1s idle
        set({ _timer: timer });
      },
      saveSession: async () => {
        const { count, selected } = get();
        if (count <= 0) return;
        const user = JSON.parse(localStorage.getItem("ihsan_user") || "{}");
        if (!user?.uid) return; // not logged in: keep local only
        set({ isSaving: true });
        try {
          const idToken = localStorage.getItem("ihsan_idToken");
          await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/zikr/session`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: idToken ? `Bearer ${idToken}` : "",
            },
            body: JSON.stringify({
              date: new Date().toISOString(),
              zikrType: selected,
              count,
            }),
          });
        } catch (e) {
          console.error(e);
        } finally {
          set({ isSaving: false }); // do NOT reset count automatically
        }
      },
    }),
    {
      name: "ihsan_zikr_store",
      partialize: (state) => ({
        selected: state.selected,
        count: state.count,
        types: state.types,
      }),
    }
  )
);
