import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getUserTimezoneOffset } from '../utils/timezone.js';
import { getTrackingDay, getTrackingDayMiddayTs } from '../utils/trackingDay.js';
import { API_BASE, getIdToken } from '../lib/api.js';

const FLUSH_DELAY = 800; // ms

// Timezone offset is stable for the whole session — compute once.
const SESSION_TZ_OFFSET = getUserTimezoneOffset();

// Debounce localStorage writes so rapid tapping doesn't block the main thread.
// Reads are always synchronous (needed for hydration on mount).
const PERSIST_DEBOUNCE_MS = 400;
const _persistTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const rawDebouncedStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => {
    clearTimeout(_persistTimers[name]);
    _persistTimers[name] = setTimeout(() => localStorage.setItem(name, value), PERSIST_DEBOUNCE_MS);
  },
  removeItem: (name: string) => {
    clearTimeout(_persistTimers[name]);
    localStorage.removeItem(name);
  },
};
const debouncedStorage = createJSONStorage(() => rawDebouncedStorage);

export interface CustomMeaning {
  /** Compact Arabic shown on the counter card */
  arabic?: string;
  /** Compact meaning shown on the counter card */
  meaning: string;
  /** Complete Arabic text — the expandable reference card shows this */
  fullArabic?: string;
  /** Complete meaning for the expandable reference card */
  fullMeaning?: string;
  source?: string;
  sourceUrl?: string;
  grade?: string;
  virtue?: string;
}

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
  customMeanings: Record<string, CustomMeaning>;
  _flushTimer?: ReturnType<typeof setTimeout>;

  checkAndResetIfNewDay: () => void;
  setTypes: (types: string[]) => void;
  replaceTypes: (types: string[]) => void;
  removeType: (name: string) => void;
  renameType: (oldName: string, newName: string) => void;
  selectType: (selected: string) => void;
  setCustomMeaning: (name: string, data: CustomMeaning) => void;
  resetAll: () => void;
  hydrate: () => Promise<void>;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  addConfirmedCounts: (type: string, amount: number) => void;
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
      customMeanings: {},

      checkAndResetIfNewDay: () => {
        const today = getTrackingDay();
        const lastReset = get().lastResetDate;
        if (lastReset !== today) {
          set({ counts: {}, pending: {}, lastResetDate: today });
        }
      },

      setTypes: (types) => set({ types }),

      replaceTypes: (types) =>
        set({ types, counts: {}, pending: {}, selected: types[0] ?? 'SubhanAllah' }),

      removeType: (name) =>
        set((s) => {
          const types = s.types.filter((t) => t !== name);
          const customMeanings = { ...s.customMeanings };
          delete customMeanings[name];
          const selected = s.selected === name ? (types[0] ?? 'SubhanAllah') : s.selected;
          return { types, customMeanings, selected };
        }),

      // Rename in place: list entry, today's counts, pending deltas and the
      // stored meaning all move to the new key (server migration is separate).
      renameType: (oldName, newName) =>
        set((s) => {
          const types = s.types.map((t) => (t === oldName ? newName : t));
          const move = <T,>(rec: Record<string, T>): Record<string, T> => {
            if (!(oldName in rec)) return rec;
            const next = { ...rec };
            const v = next[oldName];
            delete next[oldName];
            if (v !== undefined) next[newName] = v;
            return next;
          };
          return {
            types,
            counts: move(s.counts),
            pending: move(s.pending),
            lifetimeTotals: move(s.lifetimeTotals),
            customMeanings: move(s.customMeanings),
            selected: s.selected === oldName ? newName : s.selected,
          };
        }),

      selectType: (selected) => set({ selected }),

      setCustomMeaning: (name, data) =>
        set((s) => ({ customMeanings: { ...s.customMeanings, [name]: data } })),

      resetAll: () =>
        set({
          counts: {},
          pending: {},
          lifetimeTotals: {},
          total: 0,
          selected: 'SubhanAllah',
          types: ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'La ilaha illallah'],
          customMeanings: {},
        }),

      hydrate: async () => {
        get().checkAndResetIfNewDay();
        const idToken = await getIdToken();
        if (!idToken) return;
        try {
          const tzOffset = get().timezoneOffset ?? SESSION_TZ_OFFSET;
          const res = await fetch(
            `${API_BASE}/api/zikr/summary?timezoneOffset=${tzOffset}&today=${getTrackingDay()}`,
            { headers: { Authorization: `Bearer ${idToken}` } }
          );
          if (!res.ok) return;
          const data = await res.json() as {
            totalCount?: number;
            perType?: Array<{ zikrType: string; total: number }>;
            types?: Array<{ name: string } | string>;
            today?: { total: number; perType: Record<string, number> };
          };
          const lt = (data.perType ?? []).reduce<Record<string, number>>((acc, t) => {
            acc[t.zikrType] = t.total;
            return acc;
          }, {});
          set({ total: data.totalCount ?? 0, lifetimeTotals: lt });
          // Sync TODAY's counts from the DB so every browser/device agrees.
          // Local unflushed pending deltas are layered on top.
          if (data.today?.perType) {
            const pending = get().pending;
            const counts: Record<string, number> = {};
            const typeNames = new Set([
              ...Object.keys(data.today.perType),
              ...Object.keys(pending),
            ]);
            for (const t of typeNames) {
              counts[t] = Math.max(0, (data.today.perType[t] ?? 0) + (pending[t] ?? 0));
            }
            set({ counts, lastResetDate: getTrackingDay() });
          }
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
        // checkAndResetIfNewDay is intentionally NOT called here — App.tsx handles it on
        // mount/focus/visibility. Calling it on every tap added unnecessary work per count.
        set((s) => {
          const type = s.selected;
          return {
            counts: { ...s.counts, [type]: (s.counts[type] ?? 0) + 1 },
            lifetimeTotals: { ...s.lifetimeTotals, [type]: (s.lifetimeTotals[type] ?? 0) + 1 },
            pending: { ...s.pending, [type]: (s.pending[type] ?? 0) + 1 },
            total: s.total + 1,
          };
        });
      },

      decrement: () =>
        set((s) => {
          const type = s.selected;
          const current = s.counts[type] ?? 0;
          if (current <= 0) return {};
          return {
            counts: { ...s.counts, [type]: current - 1 },
            lifetimeTotals: { ...s.lifetimeTotals, [type]: Math.max(0, (s.lifetimeTotals[type] ?? 0) - 1) },
            // Pending may go NEGATIVE — that's how a decrement of an
            // already-flushed count reaches the server (clamping at 0 here
            // silently dropped the minus button's effect on the DB).
            pending: { ...s.pending, [type]: (s.pending[type] ?? 0) - 1 },
            total: Math.max(0, s.total - 1),
          };
        }),

      // Reset clears only this session's local count — server-confirmed data in analytics is unaffected
      reset: () =>
        set((s) => {
          const cleared = s.counts[s.selected] ?? 0;
          return {
            counts: { ...s.counts, [s.selected]: 0 },
            pending: { ...s.pending, [s.selected]: 0 },
            total: Math.max(0, s.total - cleared),
          };
        }),

      // Used after manual API-confirmed entry — updates local counts without touching pending
      addConfirmedCounts: (type, amount) =>
        set((s) => ({
          counts: { ...s.counts, [type]: (s.counts[type] ?? 0) + amount },
          lifetimeTotals: { ...s.lifetimeTotals, [type]: (s.lifetimeTotals[type] ?? 0) + amount },
          total: s.total + amount,
        })),

      scheduleFlush: () => {
        clearTimeout(get()._flushTimer);
        const t = setTimeout(() => void get().flush(), FLUSH_DELAY);
        set({ _flushTimer: t });
      },

      flush: async () => {
        // Prevent concurrent flushes
        if (get().isFlushing) return;

        // Snapshot pending at this moment — any taps during the request stay safe
        const snapshot = { ...get().pending };
        const entries = Object.entries(snapshot).filter(([, a]) => a !== 0);
        if (!entries.length) return;

        const idToken = await getIdToken();
        if (!idToken) return;

        const resolvedOffset = get().timezoneOffset ?? SESSION_TZ_OFFSET;
        // Anchor every increment INSIDE the current tracking day (midday ts):
        // with the Fajr boundary, a 1 AM tap belongs to the CLOSING day's
        // bucket — Date.now() would land it in the next civil day.
        const anchorTs = getTrackingDayMiddayTs();
        const payload = entries.map(([zikrType, amount]) => ({
          zikrType,
          amount,
          ts: anchorTs,
          timezoneOffset: resolvedOffset,
        }));

        set({ isFlushing: true });
        try {
          const res = await fetch(`${API_BASE}/api/zikr/increment/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ increments: payload, timezoneOffset: resolvedOffset, today: getTrackingDay() }),
          });

          if (!res.ok) {
            // Keep pending intact — counts will be retried on next flush
            console.warn(`Batch flush returned ${res.status} — pending preserved for retry`);
            return;
          }

          // Only subtract the amounts we confirmed were saved (not everything —
          // user may have tapped during the request). No clamping: pending can
          // legitimately be negative (queued decrements).
          set((s) => {
            const newPending = { ...s.pending };
            for (const [type, amount] of entries) {
              newPending[type] = (newPending[type] ?? 0) - amount;
            }
            return { pending: newPending };
          });
        } catch (e) {
          console.error('Flush error — pending preserved:', e);
        } finally {
          set({ isFlushing: false });
        }
      },
    }),
    {
      name: 'ihsan_zikr_store',
      storage: debouncedStorage,
      partialize: (state) => ({
        selected: state.selected,
        types: state.types,
        counts: state.counts,
        pending: state.pending,
        total: state.total,
        lastResetDate: state.lastResetDate,
        customMeanings: state.customMeanings,
      }),
    }
  )
);
