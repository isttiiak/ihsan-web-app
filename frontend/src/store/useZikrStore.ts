import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserTimezoneOffset, getTodayLocal } from '../utils/timezone.js';

const FLUSH_DELAY = 800; // ms

interface ZikrState {
  types: string[];
  selected: string;
  counts: Record<string, number>;
  lifetimeTotals: Record<string, number>;
  pending: Record<string, number>;
  total: number;
  isFlushing: boolean;
  lastResetDate: string | null;
  timezoneOffset?: number;
  _flushTimer?: ReturnType<typeof setTimeout>;

  checkAndResetIfNewDay: () => void;
  setTypes: (types: string[]) => void;
  replaceTypes: (types: string[]) => void;
  selectType: (selected: string) => void;
  resetAll: () => void;
  hydrate: () => Promise<void>;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  scheduleFlush: () => void;
  flush: () => Promise<void>;
}

export const useZikrStore = create<ZikrState>()(
  persist(
    (set, get) => ({
      types: ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'La ilaha illallah'],
      selected: 'SubhanAllah',
      counts: {},
      lifetimeTotals: {},
      pending: {},
      total: 0,
      isFlushing: false,
      lastResetDate: null,

      checkAndResetIfNewDay: () => {
        const today = getTodayLocal();
        const lastReset = get().lastResetDate;
        if (lastReset !== today) {
          set({ counts: {}, pending: {}, lastResetDate: today });
        }
      },

      setTypes: (types) => set({ types }),

      replaceTypes: (types) =>
        set({ types, counts: {}, pending: {}, selected: types[0] ?? 'SubhanAllah' }),

      selectType: (selected) => set({ selected }),

      resetAll: () =>
        set({
          counts: {},
          pending: {},
          lifetimeTotals: {},
          total: 0,
          selected: 'SubhanAllah',
          types: ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'La ilaha illallah'],
        }),

      hydrate: async () => {
        get().checkAndResetIfNewDay();
        const idToken = localStorage.getItem('ihsan_idToken');
        if (!idToken) return;
        try {
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/zikr/summary`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (!res.ok) return;
          const data = await res.json() as {
            totalCount?: number;
            perType?: Array<{ zikrType: string; total: number }>;
            types?: Array<{ name: string } | string>;
          };
          const lt = (data.perType ?? []).reduce<Record<string, number>>((acc, t) => {
            acc[t.zikrType] = t.total;
            return acc;
          }, {});
          set({ total: data.totalCount ?? 0, lifetimeTotals: lt });
          if (Array.isArray(data.types) && data.types.length) {
            const serverNames = data.types
              .map((t) => (typeof t === 'object' ? t.name : t))
              .filter(Boolean) as string[];
            const merged = [...new Set([...(get().types ?? []), ...serverNames])];
            const currentSelected = get().selected;
            set({ types: merged });
            if (!merged.includes(currentSelected)) set({ selected: merged[0] });
          }
        } catch (e) {
          console.error(e);
        }
      },

      increment: () => {
        get().checkAndResetIfNewDay();
        const timezoneOffset = getUserTimezoneOffset();
        set(
          (s) => {
            const type = s.selected;
            return {
              counts: { ...s.counts, [type]: (s.counts[type] ?? 0) + 1 },
              lifetimeTotals: { ...s.lifetimeTotals, [type]: (s.lifetimeTotals[type] ?? 0) + 1 },
              pending: { ...s.pending, [type]: (s.pending[type] ?? 0) + 1 },
              total: s.total + 1,
              timezoneOffset,
            };
          }
        );
      },

      decrement: () =>
        set((s) => {
          const type = s.selected;
          const current = s.counts[type] ?? 0;
          if (current <= 0) return {};
          return { counts: { ...s.counts, [type]: current - 1 } };
        }),

      reset: () =>
        set((s) => ({
          counts: { ...s.counts, [s.selected]: 0 },
          pending: { ...s.pending, [s.selected]: 0 },
        })),

      scheduleFlush: () => {
        clearTimeout(get()._flushTimer);
        const t = setTimeout(() => void get().flush(), FLUSH_DELAY);
        set({ _flushTimer: t });
      },

      flush: async () => {
        const { pending, timezoneOffset } = get();
        const idToken = localStorage.getItem('ihsan_idToken');
        if (!idToken) return;
        const resolvedOffset = timezoneOffset ?? getUserTimezoneOffset();
        const payload = Object.entries(pending)
          .filter(([, a]) => a > 0)
          .map(([zikrType, amount]) => ({ zikrType, amount, timezoneOffset: resolvedOffset }));
        if (!payload.length) return;
        set({ isFlushing: true });
        try {
          await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/zikr/increment/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ increments: payload, timezoneOffset: resolvedOffset }),
          });
          set((s) => ({
            pending: Object.fromEntries(Object.keys(s.pending).map((k) => [k, 0])),
          }));
          void get().hydrate();
        } catch (e) {
          console.error(e);
        } finally {
          set({ isFlushing: false });
        }
      },
    }),
    {
      name: 'ihsan_zikr_store',
      partialize: (state) => ({
        selected: state.selected,
        types: state.types,
        counts: state.counts,
        pending: state.pending,
        total: state.total,
        lastResetDate: state.lastResetDate,
      }),
    }
  )
);
