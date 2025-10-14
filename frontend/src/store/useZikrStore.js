import { create } from "zustand";
import { persist } from "zustand/middleware";

const FLUSH_DELAY = 800; // ms

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
      counts: {}, // per-type current (persisted)
      lifetimeTotals: {},
      pending: {},
      total: 0,
      isFlushing: false,
      setTypes: (types) => set({ types }),
      replaceTypes: (types) =>
        set({
          types,
          counts: {},
          pending: {},
          selected: types[0] || "SubhanAllah",
        }),
      selectType: (selected) => set({ selected }),
      resetAll: () =>
        set({
          counts: {},
          pending: {},
          lifetimeTotals: {},
          total: 0,
          selected: "SubhanAllah",
          types: [
            "SubhanAllah",
            "Alhamdulillah",
            "Allahu Akbar",
            "La ilaha illallah",
          ],
        }),
      hydrate: async () => {
        const idToken = localStorage.getItem("ihsan_idToken");
        if (!idToken) return;
        try {
          const res = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/zikr/summary`,
            { headers: { Authorization: `Bearer ${idToken}` } }
          );
          if (!res.ok) return;
          const data = await res.json();
          const lt = data.perType.reduce((acc, t) => {
            acc[t.zikrType] = t.total;
            return acc;
          }, {});
          set({ total: data.totalCount || 0, lifetimeTotals: lt });
          // Merge server types (objects or strings) WITHOUT resetting selection or counts
          if (Array.isArray(data.types) && data.types.length) {
            const serverNames = data.types
              .map((t) => t.name || t)
              .filter(Boolean);
            const merged = [
              ...new Set([...(get().types || []), ...serverNames]),
            ];
            const currentSelected = get().selected;
            set({ types: merged });
            if (!merged.includes(currentSelected)) set({ selected: merged[0] });
          }
        } catch (e) {
          console.error(e);
        }
      },
      increment: () =>
        set(
          (s) => {
            const type = s.selected;
            const current = s.counts[type] || 0;
            const pend = s.pending[type] || 0;
            const life = s.lifetimeTotals[type] || 0;
            return {
              counts: { ...s.counts, [type]: current + 1 },
              lifetimeTotals: { ...s.lifetimeTotals, [type]: life + 1 },
              pending: { ...s.pending, [type]: pend + 1 },
              total: s.total + 1,
            };
          },
          false,
          "increment"
        ),
      decrement: () =>
        set((s) => {
          const type = s.selected;
          const current = s.counts[type] || 0;
          if (current <= 0) return {};
          return { counts: { ...s.counts, [type]: current - 1 } };
        }),
      reset: () =>
        set(
          (s) => ({ counts: { ...s.counts, [s.selected]: 0 } }),
          false,
          "reset"
        ),
      scheduleFlush: () => {
        clearTimeout(get()._flushTimer);
        const t = setTimeout(() => get().flush(), FLUSH_DELAY);
        set({ _flushTimer: t });
      },
      flush: async () => {
        const { pending } = get();
        const idToken = localStorage.getItem("ihsan_idToken");
        if (!idToken) return;
        const payload = Object.entries(pending)
          .filter(([, a]) => a > 0)
          .map(([zikrType, amount]) => ({ zikrType, amount }));
        if (!payload.length) return;
        set({ isFlushing: true });
        try {
          await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/zikr/increment/batch`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ increments: payload }),
            }
          );
          set((s) => ({
            pending: Object.fromEntries(
              Object.keys(s.pending).map((k) => [k, 0])
            ),
          }));
          // Refresh lifetime totals without touching counts
          get().hydrate();
        } catch (e) {
          console.error(e);
        } finally {
          set({ isFlushing: false });
        }
      },
    }),
    {
      name: "ihsan_zikr_store",
      partialize: (state) => ({
        selected: state.selected,
        types: state.types,
        counts: state.counts,
        pending: state.pending,
        total: state.total,
      }),
    }
  )
);
