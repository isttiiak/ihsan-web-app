import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { getTrackingDay } from '../utils/trackingDay.js';

export const QURAN_TOTAL_PAGES = 604;
export const QURAN_TOTAL_AYAT = 6236;

/** Juz number for a mushaf page (standard Madani layout: juz 2 starts p.22, then every 20 pages) */
export function juzForPage(page: number): number {
  if (page < 22) return 1;
  return Math.min(30, Math.floor((page - 2) / 20) + 1);
}

export interface QuranBookmark { surah: number; ayah: number }

export interface QuranSummary {
  profile: {
    dailyGoalPages: number;
    currentPage: number;
    khatmCount: number;
    totalPages: number;
    dailyGoalAyat: number;
    currentAyah: number;
    totalAyat: number;
    /** null = khatam journey not started (opt-in) */
    khatamStartedAt: string | null;
    /** Per-surah reader resume positions (cross-device) */
    readerPos: Record<string, number>;
    /** Saved curated dua ids */
    savedDuas: string[];
  };
  todayPages: number;
  /** Today's ayat-equivalents (ayat + pages·10) — the v4 goal/streak unit */
  todayAyat: number;
  goalMet: boolean;
  streak: number;
  bestStreak: number;
  last7: Array<{ date: string; pages: number; units: number }>;
  stats: { last30Pages: number; allTimePages: number; last30Units: number; allTimeUnits: number };
  pace: number | null;
  estDaysToKhatm: number | null;
  topSurahs: Array<{ surah: number; completions: number }>;
  bookmarks: QuranBookmark[];
}

// Fajr-boundary tracking day (falls back to civil midnight without a location)
export function localTodayStr(): string {
  return getTrackingDay();
}

export function useQuranSummary() {
  const user = useAuthStore((s) => s.user);
  const today = localTodayStr();
  return useQuery({
    queryKey: ['quran', 'summary', today],
    queryFn: async () => {
      const { data } = await api.get<QuranSummary & { ok: boolean }>(`/api/quran/summary?today=${today}`);
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useLogReading() {
  const qc = useQueryClient();
  const today = localTodayStr();
  return useMutation({
    mutationFn: async (vars: { pages: number; advancePosition: boolean }) => {
      const { data } = await api.post<{ ok: boolean; khatmCompleted: boolean }>('/api/quran/read', {
        date: today,
        pages: vars.pages,
        advancePosition: vars.advancePosition,
      });
      return data;
    },
    // Optimistic: bump today's pages (and the bookmark) immediately
    onMutate: async (vars) => {
      const key = ['quran', 'summary', today];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<QuranSummary>(key);
      qc.setQueryData<QuranSummary>(key, (old) => {
        if (!old) return old;
        const todayPages = old.todayPages + vars.pages;
        return {
          ...old,
          todayPages,
          goalMet: todayPages >= old.profile.dailyGoalPages,
          profile: {
            ...old.profile,
            currentPage: vars.advancePosition
              ? (old.profile.currentPage + Math.round(vars.pages)) % QURAN_TOTAL_PAGES
              : old.profile.currentPage,
          },
        };
      });
      return { previous, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['quran', 'summary'] });
    },
  });
}

export function useUpdateQuranProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { dailyGoalPages?: number; currentPage?: number; dailyGoalAyat?: number; currentAyah?: number }) => {
      const { data } = await api.patch('/api/quran/profile', vars);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['quran', 'summary'] });
    },
  });
}


// ── v4 ayah engine ────────────────────────────────────────────────────────────

/** Log ayat read (reader auto-logging). Khatam mode also advances the bookmark. */
export function useReadAyat() {
  const qc = useQueryClient();
  const today = localTodayStr();
  return useMutation({
    mutationFn: async (vars: { count: number; surah?: number; advanceKhatm?: boolean; completedSurah?: boolean }) => {
      const { data } = await api.post<{ ok: boolean; khatmCompleted: boolean; currentAyah: number; todayAyat: number }>(
        '/api/quran/read-ayat',
        { date: today, ...vars }
      );
      return data;
    },
    onMutate: async (vars) => {
      const key = ['quran', 'summary', today];
      await qc.cancelQueries({ queryKey: key });
      qc.setQueryData<QuranSummary>(key, (old) => {
        if (!old) return old;
        const todayAyat = old.todayAyat + vars.count;
        return {
          ...old,
          todayAyat,
          goalMet: todayAyat >= old.profile.dailyGoalAyat,
          profile: vars.advanceKhatm
            ? { ...old.profile, currentAyah: (old.profile.currentAyah + vars.count) % QURAN_TOTAL_AYAT }
            : old.profile,
        };
      });
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['quran'] }),
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { surah: number; ayah: number }) => {
      const { data } = await api.post<{ ok: boolean; bookmarks: QuranBookmark[] }>('/api/quran/bookmark', vars);
      return data.bookmarks;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['quran', 'summary'] }),
  });
}

/** Save (ayah 0 clears) the per-surah resume position on the server. */
export function useSetResume() {
  return useMutation({
    mutationFn: async (vars: { surah: number; ayah: number }) => {
      await api.put('/api/quran/resume', vars);
    },
  });
}

export function useToggleDuaBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (duaId: string) => {
      const { data } = await api.post<{ ok: boolean; savedDuas: string[] }>('/api/quran/dua-bookmark', { duaId });
      return data.savedDuas;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['quran', 'summary'] }),
  });
}

export function useStartKhatam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ ok: boolean; khatamStartedAt: string }>('/api/quran/khatam/start');
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['quran', 'summary'] }),
  });
}

export function useResetKhatam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { await api.post('/api/quran/khatam/reset'); },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['quran', 'summary'] }),
  });
}

export interface TafsirResult {
  text: string;
  resourceName: string;
  editionId: number;
  language: 'en' | 'bn';
  url: string;
}

/** Authentic tafsir for an āyah (proxied from quran.com). */
export function useTafsir(surah: number, ayah: number, editionId: number, enabled = true) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['quran', 'tafsir', surah, ayah, editionId],
    queryFn: async () => {
      const { data } = await api.get<TafsirResult & { ok: boolean }>(
        `/api/quran/tafsir?surah=${surah}&ayah=${ayah}&editionId=${editionId}`
      );
      return data;
    },
    enabled: !!user && enabled && surah > 0 && ayah > 0,
    staleTime: 24 * 60 * 60_000, // tafsir text never changes
  });
}

export function useQuranHistory(days = 30, enabled = true) {
  const user = useAuthStore((s) => s.user);
  const today = localTodayStr();
  return useQuery({
    queryKey: ['quran', 'history', days, today],
    queryFn: async () => {
      const { data } = await api.get<{ ok: boolean; history: Array<{ date: string; ayat: number; pages: number; units: number }> }>(
        `/api/quran/history?days=${days}&today=${today}`
      );
      return data.history;
    },
    enabled: !!user && enabled,
    staleTime: 60_000,
  });
}
